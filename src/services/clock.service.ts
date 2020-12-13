import { PubSub } from "apollo-server";
import { IClock } from "../models/Round";
import { ROUND_CLOCK } from "../graphql/round";
import { Game } from "../models/Game";
import { logger, GAME_STATE_CHANGED } from "../common";
import roundService from "./round.service";
import submissionService from "./submission.service";

export class ClockService {
    //Track running intervals for each game so they can be created and cleared accordingly
    private gameIntervalMap: Map<string, NodeJS.Timeout> = new Map();
    startSubmissionClock(gameId: string, pubsub: PubSub) {
        let clock: IClock = { gameId: gameId, minutes: +process.env.SUBMISSION_TIMER_MINUTES, seconds: +process.env.SUBMISSION_TIMER_SECONDS };
        return this.startClock(gameId, pubsub, clock, this.endSubmission.bind(this));

    }

    startVoteClock(gameId: string, pubsub: PubSub) {
        let clock: IClock = { gameId: gameId, minutes: +process.env.VOTE_TIMER_MINUTES, seconds: +process.env.VOTE_TIMER_SECONDS };
        return this.startClock(gameId, pubsub, clock, this.endRound.bind(this));

    }

    clearGameTimer(gameId: string): boolean {
        const gameInterval: NodeJS.Timeout = this.gameIntervalMap.get(gameId);
        if (gameInterval) {
            clearInterval(gameInterval);
            this.gameIntervalMap.delete(gameId);
            return true;
        }
        return false;
    }

    private startClock(gameId: string, pubsub: PubSub, clock: IClock, runoutCallback: (gameId: string, pubsub: PubSub) => Promise<void>) {
        this.clearGameTimer(gameId);
        let interval: NodeJS.Timeout = setInterval(async () => {
            if (clock.seconds > 0) {
                clock = { ...clock, seconds: clock.seconds - 1 };
            }
            else if (clock.seconds === 0) {
                if (clock.minutes === 0) {
                    //Timer has run out
                    runoutCallback(gameId, pubsub);
                } else {
                    clock = { ...clock, seconds: 59, minutes: clock.minutes - 1 };
                }
            }
            pubsub.publish(ROUND_CLOCK, {
                roundClock: clock,
            });
        }, 1000);
        this.gameIntervalMap.set(gameId, interval);
    }

    /* Callback functions after clock ends */
    private async endSubmission(gameId: string, pubsub: PubSub): Promise<void> {
        logger.info("Timer has run out...submission is over");
        let updatedGame: Game = await submissionService.updateSubmissionStatus(gameId, false, pubsub);
        //If submission is over and no one has submitted, voting cannot take place -> end round
        if (updatedGame.submittedGifs.length == 0) {
            logger.info("No gifs were submitted when submission ended. Proceeding to skip voting and end active round.")
            updatedGame = await roundService.updateRoundStatus(gameId, false);
        }
        pubsub.publish(GAME_STATE_CHANGED, {
            gameStateChanged: updatedGame,
        });
    }

    private async endRound(gameId: string, pubsub: PubSub): Promise<void> {
        logger.info("Timer has run out...round is over");
        const updatedGame: Game = await roundService.updateRoundStatus(gameId, false);
        pubsub.publish(GAME_STATE_CHANGED, {
            gameStateChanged: updatedGame,
        });
    }
}
export default new ClockService();