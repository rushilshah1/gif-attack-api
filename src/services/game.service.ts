import { Game, GameModel } from "../models/game";
import { UserInputError, PubSub } from "apollo-server";
import { USER_REMOVED_FROM_GAME } from "../graphql/game";
import { logger } from "../common";

export class GameService {
  async removeUser(
    gameId: string,
    userName: string,
    pubsub: PubSub
  ): Promise<Game> {
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
    await pubsub.publish(USER_REMOVED_FROM_GAME, {
      userRemovedFromGame: game,
    });
    logger.info(`Removing ${userName} from ${gameId}`);
    return game;
  }
}
export default new GameService();
