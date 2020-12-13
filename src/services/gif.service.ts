import { Game, GameModel } from "../models/Game";
import { UserInputError, PubSub } from "apollo-server";
import { SubmittedGif } from "../models/SubmittedGif";
import * as _ from "lodash";
import roundService from "./round.service";
import gameService from "./game.service";
import userService from "./user.service";
import submissionService from "./submission.service";

export class GifService {
  async addSubmittedGif(gameId: string, newGif: SubmittedGif, pubsub: PubSub): Promise<Game> {
    const game: Game = await GameModel.findByIdAndUpdate(
      gameId,
      {
        $push: {
          submittedGifs: newGif,
        },
      },
      {
        new: true,
      }
    );
    if (!game) {
      throw new UserInputError("Invalid game id");
    }

    return await submissionService.updateIfSubmissionCompleted(game, pubsub);
  }

  async removeSubmittedGif(gameId: string, deleteGif: SubmittedGif): Promise<Game> {
    const game: Game = await GameModel.findByIdAndUpdate(
      gameId,
      {
        $pull: {
          submittedGifs: { gifId: deleteGif.gifId },
        },
      },
      {
        new: true,
      }
    );
    if (!game) {
      throw new UserInputError("Invalid game id");
    }
    return game;
  }

  async removeUsersGif(gameId: string, userId: string): Promise<Game> {
    const game: Game = await GameModel.findByIdAndUpdate(
      gameId,
      {
        $pull: {
          submittedGifs: { userId: userId },
        },
      },
      {
        new: true,
      }
    );
    if (!game) {
      throw new UserInputError("Invalid game id");
    }
    return game;
  }

  async updateSubmittedGif(gameId: string, updatedGif: SubmittedGif): Promise<Game> {
    const game: Game = await GameModel.findOneAndUpdate(
      { _id: gameId, "submittedGifs._id": { $in: [updatedGif.id] } },
      {
        $set: {
          "submittedGifs.$.gifId": updatedGif.gifId,
          "submittedGifs.$.content": updatedGif.content,
          "submittedGifs.$.gifSearchText": updatedGif.gifSearchText,
          "submittedGifs.$.userId": updatedGif.userId,
          "submittedGifs.$.numVotes": updatedGif.numVotes,
          "submittedGifs.$.isWinner": updatedGif.isWinner,
        },
      },
      { new: true }
    );
    if (!game) {
      throw new UserInputError("Invalid game id or gif id provided");
    }
    return await roundService.updateIfRoundCompleted(game);
  }

  async voteForGif(gameId: string, gifId: any, userId: any): Promise<Game> {
    let currentGame: Game = await gameService.getGameById(gameId);
    currentGame = await userService.markUserVotedGif(userId, gifId, currentGame);
    const gifToVoteFor: SubmittedGif = (<Array<SubmittedGif>>currentGame.submittedGifs).find((submittedGif) => submittedGif.id === gifId);
    gifToVoteFor.numVotes += 1;
    return await this.updateSubmittedGif(gameId, gifToVoteFor);
  }
  async updateWinnerGifs(gameId: string, winningGifs: Array<SubmittedGif>): Promise<Game> {
    let updatedGame: Game;
    for (let winningGif of winningGifs) {
      winningGif.isWinner = true;
      updatedGame = await this.updateSubmittedGif(gameId, winningGif);
    }
    return updatedGame;
  }
  /** Retrieves all submitted gifs with the highest votes */
  getWinningGifs(game: Game): Array<SubmittedGif> {
    if (!game.submittedGifs || !game.submittedGifs.length) { //If no submitted gifs
      return [];
    }
    const sortedGifs: Array<SubmittedGif> = <Array<SubmittedGif>>(game.submittedGifs.sort((a: SubmittedGif, b: SubmittedGif) => b.numVotes - a.numVotes));
    const maxVotes: number = sortedGifs[0].numVotes;
    if (maxVotes === 0) { //No one voted
      return [];
    }
    const victoryLine: number = _.findLastIndex(sortedGifs, (gif: SubmittedGif) => gif.numVotes === maxVotes);
    const winningGifs: Array<SubmittedGif> = sortedGifs.slice(0, victoryLine + 1);
    return winningGifs;
  }
}
export default new GifService();
