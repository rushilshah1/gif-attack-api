import { gql, UserInputError } from "apollo-server-express";
import { withFilter } from "apollo-server";
import { logger } from "../common";
import { Game, GameModel } from "../models/game";

const USED_ADDED_TO_GAME = "USED_ADDED_TO_GAME";

export const typeDefs = gql`
  type User {
    name: String!
  }
  type Game {
    id: ID!
    users: [User]
    started: Boolean
  }
  input AddUserInput {
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
    addUserToGame(input: AddUserInput!): [User]
    startGame(gameId: ID!): Game
  }
  extend type Subscription {
    newUserInGame(gameId: ID!): Game
    # gameStarted(gameId: ID!): Game
  }
`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const resolvers = {
  Query: {
    async getUsers(_, { gameId }) {
      console.log(`Fetching users in game ${gameId}`);
      const game: Game = await GameModel.findById(gameId);
      //await sleep(5000);
      return game ? game.users : [];
    },
    async getGameById(_, { gameId }) {
      try {
        return await GameModel.findById(gameId);
      } catch (error) {
        console.error(error);
        throw new UserInputError("Invalid game id");
      }
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
      const game: Game = await GameModel.findOneAndUpdate(
        { _id: input.gameId },
        {
          $push: {
            users: { name: input.name },
          },
        },
        {
          new: true,
        }
      );
      await pubsub.publish(USED_ADDED_TO_GAME, {
        newUserInGame: game,
      });
      logger.info(`User added to game ${input.gameId}`);
      return game.users;
    },
    async startGame(_, { gameId }, { pubsub }) {
      const startedGame: Game = await GameModel.findOneAndUpdate(
        { _id: gameId },
        { started: true },
        { new: true }
      );
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
    // gameStarted: {
    //   subscribe: withFilter(
    //     (parent, args, { pubsub }) => pubsub.asyncIterator([GAME_STARTED]),
    //     (payload, variables) => {
    //       //   logger.info(payload.gameStarted.id);
    //       //   logger.info(variables.gameId);
    //       //   let toFilter = payload.gameStarted === variables.gameId;
    //       //   logger.info(`${toFilter}`);
    //       return payload.gameStarted.id === variables.gameId;
    //     }
    //   ),
    // },
  },
};
