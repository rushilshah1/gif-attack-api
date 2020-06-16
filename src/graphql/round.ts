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
    gameId: ID!
  }
  extend type Mutation {
    nextRound(input: RoundInput!): Round
  }
  extend type Subscription {
    roundChanged(gameId: ID!): Round
  }
`;

export const resolvers = {
  Mutation: {
    async nextRound(_, { input }, { pubsub }) {
      const newRound = {
        ...input,
        ...{ roundNumber: input.roundNumber + 1 },
      };
      const game: Game = await gameAttributesService.updateRoundNumber(
        input.gameId,
        input.roundNumber + 1
      );
      await pubsub.publish(NEXT_ROUND, {
        roundChanged: newRound,
      });
      return newRound;
    },
  },
  Subscription: {
    roundChanged: {
      subscribe: withFilter(
        (parent, { gameId }, { pubsub, user }) =>
          pubsub.asyncIterator([NEXT_ROUND]),
        (payload, variables, { pubsub, user }) => {
          return payload.roundStarted.gameId === variables.gameId;
        }
      ),
    },
  },
};
