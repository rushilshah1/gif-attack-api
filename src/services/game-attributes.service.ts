import { Game, GameModel } from "../models/Game";
import { UserInputError, PubSub } from "apollo-server";
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
    console.log(userToAdd);
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
      {
        $set: {
          "users.$.score": userToUpdate.score,
          "users.$.name": userToUpdate.name,
        },
      },
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

  async nextRound(gameId: string, newRoundNumber: number): Promise<Game> {
    const game: Game = await GameModel.findByIdAndUpdate(
      gameId,
      {
        $set: {
          roundNumber: newRoundNumber,
          submittedGifs: [],
          topic: "",
          roundStarted: false,
        },
      },
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
        $set: {
          roundStarted: true,
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
    return game;
  }
}
export default new GameAttributesService();
