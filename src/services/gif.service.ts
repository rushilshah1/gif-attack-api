import { Game, GameModel } from "../models/Game";
import { UserInputError } from "apollo-server";
import { SubmittedGif } from "../models/SubmittedGif";
import roundService from "./round.service";

export class GifService {
  async addSubmittedGif(gameId: string, newGif: SubmittedGif): Promise<Game> {
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

    return game;
  }

  async removeSubmittedGif(
    gameId: string,
    deleteGif: SubmittedGif
  ): Promise<Game> {
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

  async updateSubmittedGif(
    gameId: string,
    updatedGif: SubmittedGif
  ): Promise<Game> {
    const game: Game = await GameModel.findOneAndUpdate(
      { _id: gameId, "submittedGifs._id": { $in: [updatedGif.id] } },
      {
        $set: {
          "submittedGifs.$.gifId": updatedGif.gifId,
          "submittedGifs.$.content": updatedGif.content,
          "submittedGifs.$.gifSearchText": updatedGif.gifSearchText,
          "submittedGifs.$.userId": updatedGif.userId,
          "submittedGifs.$.numVotes": updatedGif.numVotes,
        },
      },
      { new: true }
    );
    if (!game) {
      throw new UserInputError("Invalid game id or gif id provided");
    }
    return await roundService.updateIfRoundCompleted(game);
  }
}
export default new GifService();
