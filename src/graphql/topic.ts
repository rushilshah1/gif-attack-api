import { gql } from "apollo-server-express";
import { PubSub, withFilter } from "apollo-server";
import { logger, GAME_STATE_CHANGED } from "../common";
import { Game } from "../models/Game";
import topicService from "../services/topic.service";

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
`;

export const resolvers = {
  Mutation: {
    async updateTopic(_, { topicInput, gameId }, { pubsub }) {
      const game: Game = await topicService.updateTopic(
        gameId,
        topicInput.topic
      );
      await pubsub.publish(GAME_STATE_CHANGED, {
        gameStateChanged: game,
      });
      return game.topic;
    },
    async removeTopic(_, { gameId }, { pubsub }) {
      const game: Game = await topicService.removeTopic(gameId);
      await pubsub.publish(GAME_STATE_CHANGED, {
        gameStateChanged: game,
      });
      return game.topic;
    },
  },
};
