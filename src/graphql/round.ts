import { gql } from "apollo-server-express";
import { withFilter } from "apollo-server";
import { logger } from "../common";
import gameAttributesService from "../services/game-attributes.service";
import { Game } from "../models/Game";
import { GAME_STATE_CHANGED } from "./game";
import { IRound } from "../models/Round";

// const ROUND_CHANGED = "ROUND_CHANGED";

export const typeDefs = gql`
  type Round {
    roundNumber: Int!
    roundActive: Boolean!
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
  # extend type Subscription {
  #   roundChanged(gameId: ID!): Game
  # }
`;

export const resolvers = {
  Mutation: {
    async newRound(_, { round, gameId }, { pubsub, user }) {
      const game: Game = await gameAttributesService.newRound(gameId, round);
      await pubsub.publish(GAME_STATE_CHANGED, {
        gameStateChanged: game,
      });
      logger.info(`Creating a new round by ${user}`);
      return game as IRound;
    },
    async updateRoundStatus(_, { round, gameId }, { pubsub, user }) {
      const game: Game = await gameAttributesService.updateRoundStatus(
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
  // Subscription: {
  //   roundChanged: {
  //     subscribe: withFilter(
  //       (parent, variables, { pubsub, user }) =>
  //         pubsub.asyncIterator([ROUND_CHANGED]),
  //       (payload, variables, { pubsub, user }) => {
  //         return payload.roundChanged.id === variables.gameId;
  //       }
  //     ),
  //   },
  // },
};
