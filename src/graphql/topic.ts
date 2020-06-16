import { gql } from "apollo-server-express";
import { PubSub, withFilter } from "apollo-server";
import { logger } from "../common";
import gameAttributesService from "../services/game-attributes.service";

const TOPIC_CHANGED = "TOPIC_CHANGED";

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
    updateTopic(input: TopicInput!): Topic
    removeTopic(gameId: ID!): Topic
  }
  extend type Subscription {
    topicChanged(gameId: ID!): Topic
  }
`;

export const resolvers = {
  Mutation: {
    async updateTopic(_, { input }, { pubsub }) {
      await gameAttributesService.updateTopic(input.gameId, input.text);
      await pubsub.publish(TOPIC_CHANGED, {
        topicChanged: input,
      });
      return input;
    },
    async removeTopic(_, { gameId }, { pubsub }) {
      const removedTopic = { gameId: gameId, text: "" };
      await gameAttributesService.removeTopic(gameId);
      await pubsub.publish(TOPIC_CHANGED, {
        topicChanged: removedTopic,
      });
      return removedTopic;
    },
  },
  Subscription: {
    topicChanged: {
      subscribe: withFilter(
        (parent, args, { pubsub }) => pubsub.asyncIterator([TOPIC_CHANGED]),
        (payload, variables) => {
          logger.info(`Subscribing to topic`);
          return payload.topicCreated.gameId === variables.gameId;
        }
      ),
    },
  },
};
