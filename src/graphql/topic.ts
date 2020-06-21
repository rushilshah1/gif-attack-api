import { gql } from "apollo-server-express";
import { PubSub, withFilter } from "apollo-server";
import { logger } from "../common";

import { Game } from "../models/Game";
import gameAttributesService from "../services/game-attributes.service";
import { GAME_STATE_CHANGED } from "./game";

// const TOPIC_CHANGED = "TOPIC_CHANGED";

export const typeDefs = gql`
  type Topic {
    topic: String!
  }
  input TopicInput {
    topic: String!
  }
  extend type Mutation {
    updateTopic(topicInput: TopicInput!, gameId: ID!): String
    removeTopic(gameId: ID!): String
  }
  # extend type Subscription {
  #   topicChanged(gameId: ID!): Topic
  # }
`;

export const resolvers = {
  Mutation: {
    async updateTopic(_, { topicInput, gameId }, { pubsub }) {
      const game: Game = await gameAttributesService.updateTopic(
        gameId,
        topicInput.topic
      );
      await pubsub.publish(GAME_STATE_CHANGED, {
        gameStateChanged: game,
      });
      return game.topic;
    },
    async removeTopic(_, { gameId }, { pubsub }) {
      const game: Game = await gameAttributesService.removeTopic(gameId);
      await pubsub.publish(GAME_STATE_CHANGED, {
        gameStateChanged: game,
      });
      return game.topic;
    },
  },
  // Subscription: {
  //   topicChanged: {
  //     subscribe: withFilter(
  //       (parent, args, { pubsub }) => pubsub.asyncIterator([TOPIC_CHANGED]),
  //       (payload, variables) => {
  //         logger.info(`Subscribing to topic`);
  //         return payload.topicChanged.id === variables.gameId;
  //       }
  //     ),
  //   },
  // },
};
