import { Game, GameModel } from "../models/Game";
import { UserInputError, PubSub } from "apollo-server";
import { USED_CHANGED_IN_GAME } from "../graphql/game";
import { logger } from "../common";
import { User } from "../models/User";
import { SubmittedGif } from "../models/SubmittedGif";
import { ObjectId } from "bson";

export class GameAttributesService {
  async removeUser(gameId: string, userId: any): Promise<Game> {
    const game: Game = await GameModel.findByIdAndUpdate(
      gameId,
      {
        $pull: {
          users: { _id: userId },
        },
      },
      {
        new: true,
      }
    );
    if (!game) {
      throw new UserInputError("Invalid game id");
    }

    // logger.info(`Removing ${userName} from ${gameId}`);
    return game;
  }

  async addUser(gameId: string, userToAdd: User): Promise<Game> {
    const game: Game = await GameModel.findByIdAndUpdate(
      gameId,
      {
        $push: {
          users: userToAdd,
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

  async updateUser(gameId: string, userToUpdate: User): Promise<Game> {
    const game: Game = await GameModel.findOneAndUpdate(
      { _id: gameId, "users._id": { $in: [userToUpdate.id] } },
      { $set: { "users.$": userToUpdate } },
      { new: true }
    );
    if (!game) {
      throw new UserInputError("Invalid game id or user information provided");
    }
    return game;
  }

  async updateTopic(gameId: string, topic: string): Promise<Game> {
    const game: Game = await GameModel.findByIdAndUpdate(
      gameId,
      { $set: { topic: topic } },
      { new: true }
    );
    if (!game) {
      throw new UserInputError("Invalid game id");
    }
    return game;
  }

  async removeTopic(gameId: string): Promise<Game> {
    const game: Game = await GameModel.findByIdAndUpdate(
      gameId,
      { $set: { topic: "" } },
      { new: true }
    );
    if (!game) {
      throw new UserInputError("Invalid game id");
    }
    return game;
  }

  async updateRoundNumber(
    gameId: string,
    newRoundNumber: number
  ): Promise<Game> {
    const game: Game = await GameModel.findByIdAndUpdate(
      gameId,
      { $set: { roundNumber: newRoundNumber } },
      { new: true }
    );
    if (!game) {
      throw new UserInputError("Invalid game id");
    }
    return game;
  }

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
      { _id: gameId, "submittedGifs.gifId": { $in: [updatedGif.gifId] } },
      { $set: { "submittedGifs.$": updatedGif } },
      { new: true }
    );
    if (!game) {
      throw new UserInputError("Invalid game id or gif id provided");
    }
    return game;
  }
}
export default new GameAttributesService();
