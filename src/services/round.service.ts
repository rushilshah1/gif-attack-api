import { IRound, IClock } from "../models/Round";
import { Game, GameModel } from "../models/Game";
import { UserInputError, PubSub } from "apollo-server";
import { User } from "../models/User";
import { SubmittedGif } from "../models/SubmittedGif";
import { logger, GAME_STATE_CHANGED } from "../common";
import userService from "./user.service";
import * as _ from "lodash";
import { ROUND_CLOCK } from "../graphql/round";
import gifService from "./gif.service";

export class RoundService {
  //Track running intervals for each game so they can be created and cleared accordingly
  private gameIntervalMap: Map<string, NodeJS.Timeout> = new Map();

  async newRound(gameId: string, newRound: IRound, pubsub: PubSub): Promise<Game> {
    const game: Game = await GameModel.findByIdAndUpdate(
      gameId,
      {
        $set: {
          roundNumber: newRound.roundNumber,
          submittedGifs: [],
          topic: "",
          roundActive: newRound.roundActive,
          submissionActive: true
        },
      },
      { new: true }
    );
    if (!game) {
      throw new UserInputError("Invalid game id");
    }
    this.startClock(game.id, pubsub, this.endSubmission.bind(this));
    return game;
  }

  /**Updates the round status. If round active status is set to false, the winning players and gifs will also be updated */
  async updateRoundStatus(gameId: string, roundActiveStatus: boolean): Promise<Game> {
    const game: Game = await GameModel.findByIdAndUpdate(
      gameId,
      {
        $set: {
          roundActive: roundActiveStatus,
        },
      },
      { new: true }
    );
    if (!game) {
      throw new UserInputError("Invalid game id");
    }
    //Clear the timer interval
    this.clearGameTimer(gameId);
    return roundActiveStatus ? game : await this.updateRoundDetails(game);
  }

  async updateSubmissionStatus(gameId: string, submissionActiveStatus: boolean, pubsub: PubSub): Promise<Game> {
    const game: Game = await GameModel.findByIdAndUpdate(
      gameId,
      {
        $set: {
          submissionActive: submissionActiveStatus,
        },
      },
      { new: true }
    );
    if (!game) {
      throw new UserInputError("Invalid game id");
    }
    //Clear the timer interval
    this.clearGameTimer(gameId);
    this.startClock(game.id, pubsub, this.endRound.bind(this));
    return game;
  }

  async endRound(gameId: string, pubsub: PubSub): Promise<void> {
    //Timer has run out
    const updatedGame: Game = await this.updateRoundStatus(gameId, false);
    pubsub.publish(GAME_STATE_CHANGED, {
      gameStateChanged: updatedGame,
    });
  }

  async endSubmission(gameId: string, pubsub: PubSub): Promise<void> {
    //Timer has run out
    let updatedGame: Game = await this.updateSubmissionStatus(gameId, false, pubsub);
    //If submission is over and no one has submitted, voting cannot take place -> end round
    if (updatedGame.submittedGifs.length == 0) {
      logger.info("No gifs were submitted when submission ended. Proceeding to skip voting and end active round.")
      updatedGame = await this.updateRoundStatus(gameId, false);
    }
    pubsub.publish(GAME_STATE_CHANGED, {
      gameStateChanged: updatedGame,
    });
  }

  startClock(gameId: string, pubsub: PubSub, runoutCallback: (gameId: string, pubsub: PubSub) => Promise<void>) {
    let clock: IClock = { gameId: gameId, minutes: +process.env.TIMER_MINUTES, seconds: +process.env.TIMER_SECONDS };
    this.clearGameTimer(gameId);
    let interval: NodeJS.Timeout = setInterval(async () => {
      if (clock.seconds > 0) {
        clock = { ...clock, seconds: clock.seconds - 1 };
      }
      else if (clock.seconds === 0) {
        if (clock.minutes === 0) {
          //Timer has run out
          runoutCallback(gameId, pubsub);
        } else {
          clock = { ...clock, seconds: 59, minutes: clock.minutes - 1 };
        }
      }
      pubsub.publish(ROUND_CLOCK, {
        roundClock: clock,
      });
    }, 1000);
    this.gameIntervalMap.set(gameId, interval);
  }
  async updateIfSubmissionCompleted(game: Game, pubsub: PubSub): Promise<Game> {
    if (!game.submissionActive) { //Submission is already inactive
      return game
    }
    if (game.users.length === game.submittedGifs.length) {
      const updatedGame: Game = await this.updateSubmissionStatus(game.id, false, pubsub);
      return updatedGame;
    }
    else {
      return game;
    }
  }

  async updateIfRoundCompleted(game: Game): Promise<Game> {
    if (!game.roundActive) { //Round is already completed, no update required      
      return game;
    }
    const numVotes: number = game.submittedGifs.reduce((sum: number, currentGif: SubmittedGif) => sum + currentGif.numVotes, 0);
    if (game.users.length === numVotes) { //Round is over if everyone in the game has voted
      const updatedGame: Game = await this.updateRoundStatus(game.id, false);
      return updatedGame;
    } else { //Round is not over yet      
      return game;
    }
  }
  private clearGameTimer(gameId: string): boolean {
    const gameInterval: NodeJS.Timeout = this.gameIntervalMap.get(gameId);
    if (gameInterval) {
      clearInterval(gameInterval);
      this.gameIntervalMap.delete(gameId);
      return true;
    }
    return false;
  }

  /* Updates the isWinner flag and score of gifs and users respectively */
  private async updateRoundDetails(game: Game): Promise<Game> {
    game = await userService.clearUserRoundAttributes(game.id, <Array<User>>game.users);
    const players: Array<User> = <Array<User>>game.users;
    const winningGifs: Array<SubmittedGif> = gifService.getWinningGifs(game);
    if (!winningGifs || !winningGifs.length) {
      return game;
    }
    //There are winningGifs - proceed to update gif isWinner tag and player score
    let updatedGame: Game = await gifService.updateWinnerGifs(
      game.id,
      winningGifs
    );
    const winningUserIds: Set<string> = new Set(winningGifs.map((gif: SubmittedGif) => gif.userId));
    let winningPlayers: Array<User> = [];
    winningPlayers = players.filter((player: User) => winningUserIds.has(player.id.toString()));
    updatedGame = await userService.updateWinningUsers(updatedGame.id, winningPlayers);
    return updatedGame;
  }
}
export default new RoundService();
