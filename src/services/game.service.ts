import { Game, GameModel } from "../models/Game";
import { UserInputError, PubSub } from "apollo-server";
import { logger } from "../common";

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

  async createGame(): Promise<Game> {
    const gameModel = new GameModel();
    const newGame: Game = await gameModel.save();
    return newGame;
  }

  async startGame(id: string): Promise<Game> {
    const startedGame: Game = await GameModel.findByIdAndUpdate(
      id,
      { gameStarted: true },
      { new: true }
    );
    if (!startedGame) {
      throw new UserInputError("Invalid game id");
    }
    return startedGame;
  }
}
export default new GameService();
