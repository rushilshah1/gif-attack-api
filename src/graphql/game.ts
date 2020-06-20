import { gql, UserInputError } from "apollo-server-express";
import { withFilter } from "apollo-server";
import { logger } from "../common";
import { Game, GameModel } from "../models/Game";
import gameService from "../services/game.service";
import { User } from "../models/User";
import gameAttributesService from "../services/game-attributes.service";

export const GAME_STATE_CHANGED: string = "GAME_STATE_CHANGED";

export const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    score: Int!
  }
  type Game {
    id: ID!
    users: [User]!
    gameStarted: Boolean!
    roundActive: Boolean!
    topic: String!
    roundNumber: Int!
    submittedGifs: [Gif]!
  }
  input AddUserInput {
    name: String!
    score: Int
  }
  input ModifyUserInput {
    id: ID!
    name: String!
    score: Int!
  }
  extend type Query {
    getUsers(gameId: ID!): [User]
    getGameById(gameId: ID!): Game
    getGames: [Game]
  }
  extend type Mutation {
    createGame: Game
    startGame(gameId: ID!): Game
    addUser(user: AddUserInput!, gameId: ID!): User
    removeUser(user: ModifyUserInput!, gameId: ID!): User
    updateUser(user: ModifyUserInput!, gameId: ID!): User
  }
  extend type Subscription {
    gameStateChanged(gameId: ID!): Game
  }
`;

export const resolvers = {
  Query: {
    async getUsers(_, { gameId }) {
      const game: Game = await gameService.getGameById(gameId);
      return game.users;
    },
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
    async addUser(_, { user, gameId }, { pubsub }) {
      const addedUser: User = new User({ name: user.name, score: 0 });
      const updatedGame: Game = await gameAttributesService.addUser(
        gameId,
        addedUser
      );
      await pubsub.publish(GAME_STATE_CHANGED, {
        gameStateChanged: updatedGame,
      });
      logger.info(`User added to game ${gameId}`);
      //Newest is added to end - TODO retrieve added user in mongo query
      return updatedGame.users[updatedGame.users.length - 1];
    },
    async removeUser(root, { user, gameId }, { pubsub }, info) {
      const userId: string = user.id;
      logger.info(`Removing user from game...${user.name}`);
      const updatedGame: Game = await gameAttributesService.removeUser(
        gameId,
        userId
      );
      await pubsub.publish(GAME_STATE_CHANGED, {
        gameStateChanged: updatedGame,
      });
      logger.info("User removed from game");
      return user;
    },
    async updateUser(_, { user, gameId }, { pubsub }) {
      const userToUpdate = new User(user);
      const updatedGame: Game = await gameAttributesService.updateUser(
        gameId,
        userToUpdate
      );
      await pubsub.publish(GAME_STATE_CHANGED, {
        gameStateChanged: updatedGame,
      });
      return updatedGame.users.find(
        (gamePlayer: User) => user.id === gamePlayer.id
      );
    },
  },
  Subscription: {
    gameStateChanged: {
      subscribe: withFilter(
        (parent, args, { pubsub, user }) =>
          pubsub.asyncIterator([GAME_STATE_CHANGED]),
        (payload, variables) => {
          logger.info(`Users changed in ${variables.gameId}`);
          return payload.gameStateChanged.id === variables.gameId;
        }
      ),
    },
  },
};
