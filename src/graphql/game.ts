import { gql } from "apollo-server-express";
import { PubSub, withFilter } from "apollo-server";
import { logger } from "../common";
import { Game, GameModel } from "../models/game";

const GAME_STARTED = "GAME_STARTED";

export const typeDefs = gql`
  type User {
    name: String!
  }
  type Game {
    id: ID!
    users: [User]
  }
  input UserInput {
    name: String!
  }
  extend type Mutation {
    createGame(user: UserInput!): Game
    addUserToGame(gameId: ID!, user: UserInput!): Game
    # startGame(gameId: ID!): Game
  }
  extend type Subscription {
    newUserInGame(gameId: ID!): Game
    # gameStarted(gameId: ID!): Game
  }
`;

export const resolvers = {
  Mutation: {
    async createGame(_, { user }, { pubsub }) {
      //Add unique game ID
      logger.info({ user });
      const gameModel = new GameModel({
        users: [user],
      });
      const newGame: Game = await gameModel.save();
      return newGame;
    },
    async addUserToGame(_, { gameId, user }, { pubsub }) {
      const addedUser: Game = await GameModel.findOneAndUpdate(
        gameId,
        { $push: { users: user } },
        { new: true }
      );
      return addedUser;
    },
    // async startGame(_, { gameId }, { pubsub }) {
    //   const startedGame: Game = await GameModel.findById(gameId);
    //   await pubsub.publish(GAME_STARTED, {
    //     gameStarted: startedGame,
    //   });
    //   return startedGame;
    // },
  },
  Subscription: {
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
