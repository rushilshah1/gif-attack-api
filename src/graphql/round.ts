import { gql } from "apollo-server-express";
import { withFilter } from "apollo-server";
import { logger } from "../common";
import { Game } from "../models/Game";
import { GAME_STATE_CHANGED } from "./game";
import { IRound } from "../models/Round";
import roundService from "../services/round.service";

export const ROUND_CLOCK = "ROUND_CLOCK";

export const typeDefs = gql`
  type Round {
    roundNumber: Int!
    roundActive: Boolean!
  }
  type Clock {
    minutes: Int!
    seconds: Int!
    gameId: String
  }
  input NewRoundInput {
    roundNumber: Int!
    roundActive: Boolean!
  }
  input UpdateRoundInput {
    roundActive: Boolean!
  }
  extend type Mutation {
    updateRoundStatus(round: UpdateRoundInput!, gameId: ID!): Boolean!
    newRound(round: NewRoundInput!, gameId: ID!): Round!
  }
  extend type Subscription {
    roundClock(gameId: ID!): Clock
  }
`;

export const resolvers = {
  Mutation: {
    async newRound(_, { round, gameId }, { pubsub, user }) {
      const game: Game = await roundService.newRound(gameId, round, pubsub);
      await pubsub.publish(GAME_STATE_CHANGED, {
        gameStateChanged: game,
      });
      logger.info(`Creating a new round by ${user}`);
      return game as IRound;
    },
    async updateRoundStatus(_, { round, gameId }, { pubsub, user }) {
      const game: Game = await roundService.updateRoundStatus(
        gameId,
        round.roundActive
      );
      await pubsub.publish(GAME_STATE_CHANGED, {
        gameStateChanged: game,
      });
      logger.info(`Round status changed by ${user}`);
      return game.roundActive;
    },
  },
  Subscription: {
    roundClock: {
      subscribe: withFilter(
        (parent, variables, { pubsub, user }) =>
          pubsub.asyncIterator([ROUND_CLOCK]),
        (payload, variables, { pubsub, user }) => {
          return payload.roundClock.gameId === variables.gameId;
        }
      ),
    },
  },
};
