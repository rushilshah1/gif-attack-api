import { gql } from "apollo-server-express";
import { withFilter } from "apollo-server";
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

// const withCancel = (asyncIterator, onCancel) => {
//   // logger.info("CANCELLING SUBSCRIPTION");
//   const asyncReturn = asyncIterator.return;

//   asyncIterator.return = () => {
//     onCancel();
//     return asyncReturn
//       ? asyncReturn.call(asyncIterator)
//       : Promise.resolve({ value: undefined, done: true });
//   };

//   return asyncIterator;
// };

export const resolvers = {
  Mutation: {
    async nextRound(_, { input }, { pubsub }) {
      const newRound = { ...input, ...{ roundNumber: input.roundNumber + 1 } };
      await pubsub.publish(NEXT_ROUND, {
        roundStarted: newRound,
      });
      logger.info("New round started");
      return newRound;
    },
  },
  Subscription: {
    roundStarted: {
      subscribe: withFilter(
        (parent, { gameId }, { pubsub, user }) =>
          pubsub.asyncIterator([NEXT_ROUND]),

        // return withCancel(
        //   pubsub.asyncIterator(NEXT_ROUND),
        //   async (response) => {
        //     logger.info(`Subscription cancelled for game: ${gameId}`);
        //     logger.info(`${user} closed subscription to ${NEXT_ROUND} topic`);
        //     const updatedGame: Game = await gameService.removeUser(
        //       gameId,
        //       user,
        //       pubsub
        //     );
        //     logger.info(`Subscription closed, do your cleanup`);
        //   }
        // );
        (payload, variables, { pubsub, user }) => {
          logger.info(`${user} is subscribing to new round topic`);
          return payload.roundStarted.gameId === variables.gameId;
        }
      ),
    },
  },
};
