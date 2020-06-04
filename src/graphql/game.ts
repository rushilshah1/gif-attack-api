import { gql, UserInputError } from "apollo-server-express";
import { withFilter } from "apollo-server";
import { logger } from "../common";
import { Game, GameModel } from "../models/game";
import gameService from "../services/game.service";

const USED_ADDED_TO_GAME: string = "USED_ADDED_TO_GAME";
export const USER_REMOVED_FROM_GAME: string = "USER_REMOVED_FROM_GAME";

export const typeDefs = gql`
  type User {
    name: String!
  }
  type Game {
    id: ID!
    users: [User]
    started: Boolean
  }
  input UserInput {
    name: String!
    gameId: ID!
  }
  extend type Query {
    getUsers(gameId: ID!): [User]
    getGameById(gameId: ID!): Game
    getGames: [Game]
  }
  extend type Mutation {
    createGame(userName: String!): Game
    addUserToGame(input: UserInput!): [User]
    removeUserFromGame(input: UserInput!): [User]
    startGame(gameId: ID!): Game
  }
  extend type Subscription {
    newUserInGame(gameId: ID!): Game
    userRemovedFromGame(gameId: ID!): Game
  }
`;

export const removeUserFromGame = async (root, { input }, { pubsub }, info) => {
  const game: Game = await GameModel.findByIdAndUpdate(
    input.gameId,
    {
      $pull: {
        users: { name: input.name },
      },
    },
    {
      new: true,
    }
  );
  if (!game) {
    throw new UserInputError("Invalid game id");
  }
  await pubsub.publish(USER_REMOVED_FROM_GAME, {
    userRemovedFromGame: game,
  });
  logger.info(`Removing ${input.name} from ${input.gameId}`);
  return game.users;
};

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
      //Add unique game ID
      logger.info(`${userName} is creating a game`);
      const gameModel = new GameModel({
        users: [{ name: userName }],
        started: false,
      });
      const newGame: Game = await gameModel.save();
      return newGame;
    },
    async addUserToGame(_, { input }, { pubsub }) {
      const game: Game = await GameModel.findByIdAndUpdate(
        input.gameId,
        {
          $push: {
            users: { name: input.name },
          },
        },
        {
          new: true,
        }
      );
      if (!game) {
        throw new UserInputError("Invalid game id");
      }
      await pubsub.publish(USED_ADDED_TO_GAME, {
        newUserInGame: game,
      });
      logger.info(`User added to game ${input.gameId}`);
      return game.users;
    },
    async removeUserFromGame(root, { input }, { pubsub }, info) {
      const gameId: string = input.gameId;
      const userName: string = input.name;
      const updatedGame: Game = await gameService.removeUser(
        gameId,
        userName,
        pubsub
      );
      return updatedGame.users;
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
  },
  Subscription: {
    newUserInGame: {
      subscribe: withFilter(
        (parent, args, { pubsub }) =>
          pubsub.asyncIterator([USED_ADDED_TO_GAME]),
        (payload, variables) => {
          logger.info(
            `New User in Game Subscription to ${payload.newUserInGame.id}`
          );
          logger.info(`Filtering based of ${variables.gameId}`);
          return payload.newUserInGame.id === variables.gameId;
        }
      ),
    },
    userRemovedFromGame: {
      subscribe: withFilter(
        (parent, args, { pubsub, user }) =>
          pubsub.asyncIterator([USER_REMOVED_FROM_GAME]),
        (payload, variables) => {
          logger.info(`User removed from ${variables.gameId}`);
          return payload.userRemovedFromGame.id === variables.gameId;
        }
      ),
    },
  },
};
