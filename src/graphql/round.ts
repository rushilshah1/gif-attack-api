import { gql } from "apollo-server-express";
import { withFilter } from "apollo-server";
import { logger } from "../common";
import gameAttributesService from "../services/game-attributes.service";
import { Game } from "../models/Game";

const NEXT_ROUND = "NEXT_ROUND";

export const typeDefs = gql`
  type Round {
    roundNumber: Int!
  }
  input RoundInput {
    roundNumber: Int!
  }
  extend type Mutation {
    nextRound(round: RoundInput!, gameId: ID!): Int!
  }
  extend type Subscription {
    roundChanged(gameId: ID!): Round
  }
`;

export const resolvers = {
  Mutation: {
    async nextRound(_, { round, gameId }, { pubsub }) {
      const game: Game = await gameAttributesService.updateRoundNumber(
        gameId,
        round.roundNumber
      );
      await pubsub.publish(NEXT_ROUND, {
        roundChanged: game,
      });
      return game.roundNumber;
    },
  },
  Subscription: {
    roundChanged: {
      subscribe: withFilter(
        (parent, variables, { pubsub, user }) =>
          pubsub.asyncIterator([NEXT_ROUND]),
        (payload, variables, { pubsub, user }) => {
          return payload.roundChanged.id === variables.gameId;
        }
      ),
    },
  },
};
