import { Game, GameModel } from "../models/game";
import { UserInputError, PubSub } from "apollo-server";
import { USED_CHANGED_IN_GAME } from "../graphql/game";
import { logger } from "../common";
import { User } from "../models/user";

export class GameService {
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
      { $set: { "users.$.score": userToUpdate.score } },
      { new: true }
    );
    if (!game) {
      throw new UserInputError("Invalid game id or user information provided");
    }
    return game;
  }
}
export default new GameService();
