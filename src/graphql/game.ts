import { gql, UserInputError } from "apollo-server-express";
import { withFilter } from "apollo-server";
import { logger } from "../common";
import { Game, GameModel } from "../models/game";
import gameService from "../services/game.service";
import { User } from "../models/user";

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
    addUserToGame(input: UserInput!): [User]
    removeUserFromGame(input: UserInput!): [User]
    userScoredInGame(input: UserInput!): [User]
  }
  extend type Subscription {
    usersChangedInGame(gameId: ID!): Game
    # newUserInGame(gameId: ID!): Game
    # userRemovedFromGame(gameId: ID!): Game
  }
`;

export const resolvers = {
  Query: {
    async getUsers(_, { gameId }) {
      console.log(`Fetching users in game ${gameId}`);
      const game: Game = await GameModel.findById(gameId);
      if (!game) {
        throw new UserInputError("Invalid game id");
      }
      return game.users;
    },
    async getGameById(_, { gameId }) {
      const game: Game = await GameModel.findById(gameId);
      if (!game) {
        throw new UserInputError("Invalid game id");
      }
      return game;
    },
    async getGames(_) {
      return await GameModel.find({});
    },
  },
  Mutation: {
    async createGame(_, { userName }) {
      logger.info(`${userName} is creating a game`);
      const gameModel = new GameModel({
        users: [{ name: userName }],
        started: false,
      });
      const newGame: Game = await gameModel.save();
      return newGame;
    },
    async startGame(_, { gameId }, { pubsub }) {
      const startedGame: Game = await GameModel.findByIdAndUpdate(
        gameId,
        { started: true },
        { new: true }
      );
      if (!startedGame) {
        throw new UserInputError("Invalid game id");
      }
      return startedGame;
    },
    async addUserToGame(_, { input }, { pubsub }) {
      const gameId: string = input.gameId;
      const userName: string = input.name;
      const updatedGame: Game = await gameService.addUser(
        gameId,
        new User({ name: userName, score: 0 })
      );
      await pubsub.publish(USED_CHANGED_IN_GAME, {
        usersChangedInGame: updatedGame,
      });
      logger.info(`User added to game ${gameId}`);
      return updatedGame.users;
    },
    async removeUserFromGame(root, { input }, { pubsub }, info) {
      const gameId: string = input.gameId;
      const userName: string = input.name;
      const updatedGame: Game = await gameService.removeUser(gameId, userName);
      await pubsub.publish(USED_CHANGED_IN_GAME, {
        usersChangedInGame: updatedGame,
      });
      return updatedGame.users;
    },
    async userScoredInGame(_, { input }, { pubsub }) {
      const gameId: string = input.gameId;
      const userToUpdate = new User({ name: input.name, score: input.score });
      const updatedGame: Game = await gameService.updateUser(
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
    // newUserInGame: {
    //   subscribe: withFilter(
    //     (parent, args, { pubsub }) =>
    //       pubsub.asyncIterator([USED_ADDED_TO_GAME]),
    //     (payload, variables) => {
    //       logger.info(
    //         `New User in Game Subscription to ${payload.newUserInGame.id}`
    //       );
    //       logger.info(`Filtering based of ${variables.gameId}`);
    //       return payload.newUserInGame.id === variables.gameId;
    //     }
    //   ),
    // },
    // userRemovedFromGame: {
    //   subscribe: withFilter(
    //     (parent, args, { pubsub, user }) =>
    //       pubsub.asyncIterator([USER_REMOVED_FROM_GAME]),
    //     (payload, variables) => {
    //       logger.info(`User removed from ${variables.gameId}`);
    //       return payload.userRemovedFromGame.id === variables.gameId;
    //     }
    //   ),
    // },
  },
};
