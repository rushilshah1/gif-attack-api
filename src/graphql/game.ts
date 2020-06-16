import { gql, UserInputError } from "apollo-server-express";
import { withFilter } from "apollo-server";
import { logger } from "../common";
import { Game, GameModel } from "../models/Game";
import gameService from "../services/game.service";
import { User } from "../models/User";
import gameAttributesService from "../services/game-attributes.service";

export const USED_CHANGED_IN_GAME: string = "USED_CHANGED_IN_GAME";

export const typeDefs = gql`
  type User {
    name: String!
    score: Int
  }
  type Game {
    id: ID!
    users: [User]
    started: Boolean
  }
  input UserInput {
    name: String!
    gameId: ID!
    score: Int
  }
  extend type Query {
    getUsers(gameId: ID!): [User]
    getGameById(gameId: ID!): Game
    getGames: [Game]
  }
  extend type Mutation {
    createGame(userName: String!): Game
    startGame(gameId: ID!): Game
    addUser(input: UserInput!): [User]
    removeUser(input: UserInput!): [User]
    updateUser(input: UserInput!): [User]
  }
  extend type Subscription {
    usersChangedInGame(gameId: ID!): Game
  }
`;

export const resolvers = {
  Query: {
    async getUsers(_, { gameId }) {
      const game: Game = await gameService.getGameById(gameId);
      return game.users;
    },
    async getGameById(_, { gameId }) {
      return gameService.getGameById(gameId);
    },
    async getGames(_) {
      return gameService.getGames();
    },
  },
  Mutation: {
    async createGame(_, { userName }) {
      return gameService.createGame(userName);
    },
    async startGame(_, { gameId }, { pubsub }) {
      return gameService.startGame(gameId);
    },
    async addUser(_, { input }, { pubsub }) {
      const gameId: string = input.gameId;
      const userName: string = input.name;
      const updatedGame: Game = await gameAttributesService.addUser(
        gameId,
        new User({ name: userName, score: 0 })
      );
      await pubsub.publish(USED_CHANGED_IN_GAME, {
        usersChangedInGame: updatedGame,
      });
      logger.info(`User added to game ${gameId}`);
      return updatedGame.users;
    },
    async removeUser(root, { input }, { pubsub }, info) {
      const gameId: string = input.gameId;
      const userName: string = input.name;
      const updatedGame: Game = await gameAttributesService.removeUser(
        gameId,
        userName
      );
      await pubsub.publish(USED_CHANGED_IN_GAME, {
        usersChangedInGame: updatedGame,
      });
      return updatedGame.users;
    },
    async updateUser(_, { input }, { pubsub }) {
      const gameId: string = input.gameId;
      const userToUpdate = new User({ name: input.name, score: input.score });
      const updatedGame: Game = await gameAttributesService.updateUser(
        gameId,
        userToUpdate
      );
      await pubsub.publish(USED_CHANGED_IN_GAME, {
        usersChangedInGame: updatedGame,
      });
      return updatedGame.users;
    },
  },
  Subscription: {
    usersChangedInGame: {
      subscribe: withFilter(
        (parent, args, { pubsub, user }) =>
          pubsub.asyncIterator([USED_CHANGED_IN_GAME]),
        (payload, variables) => {
          logger.info(`Users changed in ${variables.gameId}`);
          return payload.usersChangedInGame.id === variables.gameId;
        }
      ),
    },
  },
};
