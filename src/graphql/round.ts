import { gql } from "apollo-server-express";
import { PubSub, withFilter } from "apollo-server";
import { logger } from "../common";

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
    roundStarted(gameId: ID!): Round
  }
`;

export const resolvers = {
  Mutation: {
    async nextRound(_, { input }, { pubsub }) {
      const newRound = { ...input, ...{ roundNumber: input.roundNumber + 1 } };
      await pubsub.publish(NEXT_ROUND, {
        roundStarted: newRound,
      });
      logger.info("New round initiated");
      return newRound;
    },
  },
  Subscription: {
    roundStarted: {
      subscribe: withFilter(
        (parent, args, { pubsub }) => pubsub.asyncIterator([NEXT_ROUND]),
        (payload, variables) => {
          logger.info("Subscribing to new round topic");
          return payload.roundStarted.gameId === variables.gameId;
        }
      ),
    },
  },
};
