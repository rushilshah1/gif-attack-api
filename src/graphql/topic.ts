import { gql } from "apollo-server-express";
import { PubSub, withFilter } from "apollo-server";
import { logger } from "../common";

const TOPIC_CREATED = "TOPIC_CREATED";

export const typeDefs = gql`
  type Topic {
    gameId: ID!
    text: String!
  }
  input TopicInput {
    gameId: ID!
    text: String!
  }
  extend type Mutation {
    createTopic(input: TopicInput!): Topic
  }
  extend type Subscription {
    topicCreated(gameId: ID!): Topic
  }
`;

export const resolvers = {
  Mutation: {
    async createTopic(_, { input }, { pubsub }) {
      logger.info(`Creating ${input.text} topic`);
      await pubsub.publish(TOPIC_CREATED, {
        topicCreated: input,
      });
      return input;
    },
  },
  Subscription: {
    topicCreated: {
      subscribe: withFilter(
        (parent, args, { pubsub }) => pubsub.asyncIterator([TOPIC_CREATED]),
        (payload, variables) => {
          logger.info(`Subscribing to topic`);
          return payload.topicCreated.gameId === variables.gameId;
        }
      ),
    },
  },
};
