import { Game, GameModel } from "../models/Game";
import { UserInputError, PubSub } from "apollo-server";
import { logger } from "../common";
import { User } from "../models/User";
import roundService from "./round.service";
import gifService from "./gif.service";

export class UserService {
  async removeUser(gameId: string, userId: any): Promise<Game> {
    let game: Game = await GameModel.findByIdAndUpdate(
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
    game = await gifService.removeUserSubmittedGif(gameId, userId);
    return await roundService.updateIfRoundCompleted(game);
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

    return await roundService.updateIfRoundCompleted(game);
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

  async updateWinningUsers(
    gameId: string,
    winningUsers: Array<User>
  ): Promise<Game> {
    let updatedGame: Game;
    for (let player of winningUsers) {
      player.score += 1;
      updatedGame = await this.updateUser(gameId, player);
    }
    return updatedGame;
  }
}
export default new UserService();
