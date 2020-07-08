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
  gameIntervalMap: Map<string, NodeJS.Timeout> = new Map();

  async newRound(
    gameId: string,
    newRound: IRound,
    pubsub: PubSub
  ): Promise<Game> {
    const game: Game = await GameModel.findByIdAndUpdate(
      gameId,
      {
        $set: {
          roundNumber: newRound.roundNumber,
          submittedGifs: [],
          topic: "",
          roundActive: newRound.roundActive,
        },
      },
      { new: true }
    );
    if (!game) {
      throw new UserInputError("Invalid game id");
    }
    this.startRoundClock(game.id, pubsub);
    return game;
  }

  /**Updates the round status. If round active status is set to false, the winning players and gifs will also be updated */
  async updateRoundStatus(
    gameId: string,
    roundActiveStatus: boolean
  ): Promise<Game> {
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
    return roundActiveStatus ? game : await this.updateRoundWinners(game);
  }

  startRoundClock(gameId: string, pubsub: PubSub) {
    let clock: IClock =
      process.env.ENV === "local"
        ? { gameId: gameId, minutes: 0, seconds: 59 }
        : { gameId: gameId, minutes: 4, seconds: 1 };

    this.clearGameTimer(gameId); //Clear previous timer if there is one
    let interval: NodeJS.Timeout = setInterval(async () => {
      if (clock.seconds > 0) {
        clock = { ...clock, seconds: clock.seconds - 1 };
      }
      if (clock.seconds === 0) {
        if (clock.minutes === 0) {
          //Timer has run out
          logger.info("Timer has run out...Updating Round status");
          const updatedGame: Game = await this.updateRoundStatus(gameId, false);
          pubsub.publish(GAME_STATE_CHANGED, {
            gameStateChanged: updatedGame,
          });
        } else {
          clock = { ...clock, seconds: 59, minutes: clock.minutes - 1 };
        }
      }
      pubsub.publish(ROUND_CLOCK, {
        roundClock: clock,
      });
    }, 1000);
    logger.info(`Adding a new timer to ${gameId}`)
    this.gameIntervalMap.set(gameId, interval);
  }

  async updateIfRoundCompleted(game: Game): Promise<Game> {
    if (!game.roundActive) {
      //Round is already completed, no update required
      return game;
    }
    //Round is over if everyone in the game has voted
    const numVotes: number = game.submittedGifs.reduce(
      (sum: number, currentGif: SubmittedGif) => sum + currentGif.numVotes,
      0
    );
    if (game.users.length === numVotes) {
      const updatedGame: Game = await this.updateRoundStatus(game.id, false);
      return updatedGame;
    } else {
      //Round is not over yet
      return game;
    }
  }
  private clearGameTimer(gameId: string): boolean {
    const gameInterval: NodeJS.Timeout = this.gameIntervalMap.get(gameId);
    if (gameInterval) {
      logger.info(`Clearing the timer for ${gameId}`)
      clearInterval(gameInterval);
      this.gameIntervalMap.delete(gameId);
      return true;
    }
    return false;
  }

  /**Updates the isWinner flag and score of submitted gifs and winning players respectively */
  private async updateRoundWinners(game: Game): Promise<Game> {
    const players: Array<User> = <Array<User>>game.users;
    const winningGifs: Array<SubmittedGif> = gifService.getWinningGifs(game);
    if (!winningGifs || !winningGifs.length) {
      return game;
    }
    logger.info(`There are ${winningGifs.length} winners`);
    //There are winningGifs - proceed to update gif isWinner tag and player score
    let updatedGame: Game = await gifService.updateWinnerGifs(
      game.id,
      winningGifs
    );
    const winningUserIds: Set<string> = new Set(
      winningGifs.map((gif: SubmittedGif) => gif.userId)
    );
    let winningPlayers: Array<User> = [];
    winningPlayers = players.filter((player: User) =>
      winningUserIds.has(player.id.toString())
    );
    updatedGame = await userService.updateWinningUsers(
      updatedGame.id,
      winningPlayers
    );
    return updatedGame;
  }
}
export default new RoundService();
