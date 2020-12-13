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
import clockService from "./clock.service";
import submissionService from "./submission.service";

export class RoundService {

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
    clockService.startSubmissionClock(game.id, pubsub, clockService.endSubmission.bind(this));
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
    clockService.clearGameTimer(gameId);
    return roundActiveStatus ? game : await this.updateRoundDetails(game);
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
