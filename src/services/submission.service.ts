import { PubSub, UserInputError } from "apollo-server";
import { Game, GameModel } from "../models/Game";
import clockService from "./clock.service";
import { logger, GAME_STATE_CHANGED } from "../common";
import roundService from "./round.service";

export class SubmissionService {
    async updateSubmissionStatus(gameId: string, submissionActiveStatus: boolean, pubsub: PubSub): Promise<Game> {
        const game: Game = await GameModel.findByIdAndUpdate(
            gameId,
            {
                $set: {
                    submissionActive: submissionActiveStatus,
                },
            },
            { new: true }
        );
        if (!game) {
            throw new UserInputError("Invalid game id");
        }
        //Clear the timer interval
        clockService.clearGameTimer(gameId);
        clockService.startVoteClock(game.id, pubsub);
        return game;
    }

    async updateIfSubmissionCompleted(game: Game, pubsub: PubSub): Promise<Game> {
        if (!game.submissionActive) { //Submission is already inactive
            return game
        }
        if (game.users.length === game.submittedGifs.length) {
            const updatedGame: Game = await this.updateSubmissionStatus(game.id, false, pubsub);
            return updatedGame;
        }
        else {
            return game;
        }
    }


}
export default new SubmissionService();