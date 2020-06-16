import { Game, GameModel } from "../models/Game";
import { UserInputError, PubSub } from "apollo-server";
import { USED_CHANGED_IN_GAME } from "../graphql/game";
import { logger } from "../common";
import { User } from "../models/User";

export class GameService {
  async getGames(): Promise<Array<Game>> {
    return await GameModel.find({});
  }

  async getGameById(id: string): Promise<Game> {
    const game: Game = await GameModel.findById(id);
    if (!game) {
      throw new UserInputError("Invalid game id");
    }
    return game;
  }

  async createGame(firstUser: string): Promise<Game> {
    const gameModel = new GameModel({
      users: [{ name: firstUser }],
      started: false,
    });
    const newGame: Game = await gameModel.save();
    return newGame;
  }

  async startGame(id: string): Promise<Game> {
    const startedGame: Game = await GameModel.findByIdAndUpdate(
      id,
      { started: true },
      { new: true }
    );
    if (!startedGame) {
      throw new UserInputError("Invalid game id");
    }
    return startedGame;
  }
}
export default new GameService();
