import { Game, GameModel } from "../models/Game";
import { UserInputError, PubSub } from "apollo-server";
import { USED_CHANGED_IN_GAME } from "../graphql/game";
import { logger } from "../common";
import { User } from "../models/User";
import { SubmittedGif } from "../models/SubmittedGif";

export class GameAttributesService {
  async removeUser(gameId: string, userName: string): Promise<Game> {
    const game: Game = await GameModel.findByIdAndUpdate(
      gameId,
      {
        $pull: {
          users: { name: userName },
        },
      },
      {
        new: true,
      }
    );
    if (!game) {
      throw new UserInputError("Invalid game id");
    }

    logger.info(`Removing ${userName} from ${gameId}`);
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
      { _id: gameId, "users.name": { $in: [userToUpdate.name] } },
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
          gifs: newGif,
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
          gifs: { id: deleteGif.id },
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
      { _id: gameId, "gifs.id": { $in: [updatedGif.id] } },
      { $set: { "gifs.$": updatedGif } },
      { new: true }
    );
    if (!game) {
      throw new UserInputError("Invalid game id or user information provided");
    }
    return game;
  }
}
export default new GameAttributesService();
