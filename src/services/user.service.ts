import { Game, GameModel } from "../models/Game";
import { UserInputError, PubSub } from "apollo-server";
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
    game = await gifService.removeUsersGif(gameId, userId);
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
    const game: Game = await GameModel.findOneAndUpdate(
      { _id: gameId, "users._id": { $in: [userToUpdate.id] } },
      {
        $set: {
          "users.$.score": userToUpdate.score,
          "users.$.name": userToUpdate.name,
          "users.$.hasSubmitted": userToUpdate.hasSubmitted,
          "users.$.votedGif": userToUpdate.votedGif,
        },
      },
      { new: true }
    );
    if (!game) {
      throw new UserInputError("Invalid game id or user information provided");
    }
    return game;
  }

  async updateWinningUsers(gameId: string, winningUsers: Array<User>): Promise<Game> {
    let updatedGame: Game;
    for (let player of winningUsers) {
      player.score += 1;
      updatedGame = await this.updateUser(gameId, player);
    }
    return updatedGame;
  }

  async clearUserRoundAttributes(gameId: string, users: Array<User>): Promise<Game> {
    let updatedGame: Game;
    for (let player of users) {
      player.hasSubmitted = false;
      player.votedGif = '';
      updatedGame = await this.updateUser(gameId, player);
    }
    return updatedGame;
  }

  async markUserSubmission(userId: any, game: Game): Promise<Game> {
    const submittedUser: User = (<Array<User>>game.users).find((user) => user.id === userId);
    submittedUser.hasSubmitted = true;
    return await this.updateUser(game.id, submittedUser);
  }

  async markUserVotedGif(userId: any, gifId: string, game: Game,): Promise<Game> {
    const submittedUser: User = (<Array<User>>game.users).find((user) => user.id === userId);
    submittedUser.votedGif = gifId;
    return await this.updateUser(game.id, submittedUser);
  }

}
export default new UserService();
