import { Game, GameModel } from "../models/Game";
import { UserInputError, PubSub } from "apollo-server";
import { logger } from "../common";
import { User } from "../models/User";
import gameAttributesService from "./game-attributes.service";

export class UserService {
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
    return await gameAttributesService.updateIfRoundCompleted(game);
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

    return await gameAttributesService.updateIfRoundCompleted(game);
  }

  async updateUser(gameId: string, userToUpdate: User): Promise<Game> {
    logger.info("Updating user");
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
}
export default new UserService();
