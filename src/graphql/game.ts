import { gql } from "apollo-server-express";
import { withFilter } from "apollo-server";
import { logger, GAME_STATE_CHANGED } from "../common";
import { Game } from "../models/Game";
import gameService from "../services/game.service";

export const typeDefs = gql`
  type Game {
    id: ID!
    users: [User]!
    gameStarted: Boolean!
    roundActive: Boolean!
    topic: String!
    roundNumber: Int!
    submittedGifs: [Gif]!
  }
  extend type Query {
    getGameById(gameId: ID!): Game
    getGames: [Game]
  }
  extend type Mutation {
    createGame: Game
    startGame(gameId: ID!): Game
  }
  extend type Subscription {
    gameStateChanged(gameId: ID!): Game
  }
`;

export const resolvers = {
  Query: {
    async getGameById(_, { gameId }) {
      logger.info(`Get Game By id ${gameId}`);
      return gameService.getGameById(gameId);
    },
    async getGames(_) {
      return gameService.getGames();
    },
  },
  Mutation: {
    async createGame(_) {
      return gameService.createGame();
    },
    async startGame(_, { gameId }, { pubsub }) {
      const startedGame: Game = await gameService.startGame(gameId);
      await pubsub.publish(GAME_STATE_CHANGED, {
        gameStateChanged: startedGame,
      });
      return startedGame;
    },
  },
  Subscription: {
    gameStateChanged: {
      subscribe: withFilter(
        (parent, args, { pubsub, user }) =>
          pubsub.asyncIterator([GAME_STATE_CHANGED]),
        (payload, variables) => {
          return payload.gameStateChanged.id === variables.gameId;
        }
      ),
    },
  },
};
