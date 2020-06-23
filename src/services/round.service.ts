import { IRound, IClock } from "../models/Round";
import { Game, GameModel } from "../models/Game";
import { UserInputError, PubSub } from "apollo-server";
import { User } from "../models/User";
import { SubmittedGif } from "../models/SubmittedGif";
import { logger } from "../common";
import userService from "./user.service";
import * as _ from "lodash";
import { ROUND_CLOCK } from "../graphql/round";
import { GAME_STATE_CHANGED } from "../graphql/game";

export class RoundService {
  interval: NodeJS.Timeout;

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
    logger.info("Starting round clock");
    this.startRoundClock(game.id, pubsub);
    return game;
  }

  async updateRoundStatus(
    gameId: string,
    roundActiveStatus: boolean
  ): Promise<Game> {
    if (!roundActiveStatus) {
      logger.info("The round is over...Round Active is being set to false");
    }
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
    clearInterval(this.interval);

    return roundActiveStatus ? game : await this.updateWinningUsers(game);
  }

  async updateIfRoundCompleted(game: Game): Promise<Game> {
    //Rules for determing if round is over
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

  startRoundClock(gameId: string, pubsub: PubSub) {
    let clock: IClock =
      process.env.ENV === "local"
        ? { gameId: gameId, minutes: 0, seconds: 31 }
        : { gameId: gameId, minutes: 3, seconds: 1 };
    this.interval = setInterval(async () => {
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
          clearInterval(this.interval);
        } else {
          clock = { ...clock, seconds: 59, minutes: clock.minutes - 1 };
        }
      }
      pubsub.publish(ROUND_CLOCK, {
        roundClock: clock,
      });
    }, 1000);
  }

  private async updateWinningUsers(game: Game): Promise<Game> {
    const winningUsers: Array<User> = this.getWinners(game);
    //logger.info(winningUsers);
    //TODO: If more winners use Promise.all() with map function for parallel updating
    //Or have updateUsers function in service
    let updatedGame: Game = game;
    logger.info(`There are ${winningUsers.length} winners`);
    for (let user of winningUsers) {
      updatedGame = await userService.updateUser(game.id, user);
    }
    return updatedGame;
  }
  private getWinners(game: Game): Array<User> {
    const players: Array<User> = <Array<User>>game.users;
    if (!game.submittedGifs || !game.submittedGifs.length) {
      //If no submitted gifs
      return [];
    }
    const sortedGifs: Array<SubmittedGif> = <Array<SubmittedGif>>(
      game.submittedGifs.sort(
        (a: SubmittedGif, b: SubmittedGif) => b.numVotes - a.numVotes
      )
    );
    const maxVotes: number = sortedGifs[0].numVotes;
    const victoryLine: number = _.findLastIndex(
      sortedGifs,
      (gif: SubmittedGif) => gif.numVotes === maxVotes
    );
    const winnerGifs: Array<SubmittedGif> = sortedGifs.slice(
      0,
      victoryLine + 1
    );
    const consolidationGifs: Array<SubmittedGif> = sortedGifs.slice(
      victoryLine + 1
    );
    const winningUserIds: Set<string> = new Set(
      winnerGifs.map((gif: SubmittedGif) => gif.userId)
    );
    //Rules for winning the round
    //If you are the single and clear winner
    //TODO: Factor in tie/ multiple winners
    let winningPlayers: Array<User> = [];
    if (winnerGifs.length === 1) {
      winningPlayers = players.filter((player: User) =>
        winningUserIds.has(player.id.toString())
      );
      winningPlayers = winningPlayers.map((player: User) => {
        player.score += 1;
        return player;
      });
    }

    return winningPlayers;
  }
}
export default new RoundService();
