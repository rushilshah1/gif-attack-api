import { gql } from "apollo-server-express";
import { logger } from "../common";
import { Game } from "../models/Game";
import gameService from "../services/game.service";
import { User } from "../models/User";
import userService from "../services/user.service";

export const GAME_STATE_CHANGED: string = "GAME_STATE_CHANGED";

export const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    score: Int!
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
  extend type Mutation {
    addUser(user: AddUserInput!, gameId: ID!): User
    removeUser(user: ModifyUserInput!, gameId: ID!): User
    updateUser(user: ModifyUserInput!, gameId: ID!): User
  }
`;

export const resolvers = {
  Mutation: {
    async addUser(_, { user, gameId }, { pubsub }) {
      const addedUser: User = new User({ name: user.name, score: 0 });
      const updatedGame: Game = await userService.addUser(gameId, addedUser);
      await pubsub.publish(GAME_STATE_CHANGED, {
        gameStateChanged: updatedGame,
      });
      logger.info(`User added to game ${gameId}`);
      //Newest is added to end
      return updatedGame.users[updatedGame.users.length - 1];
    },
    async removeUser(root, { user, gameId }, { pubsub }, info) {
      const userId: string = user.id;
      logger.info(`Removing user from game...${user.name}`);
      const updatedGame: Game = await userService.removeUser(gameId, userId);
      await pubsub.publish(GAME_STATE_CHANGED, {
        gameStateChanged: updatedGame,
      });
      logger.info("User removed from game");
      return user;
    },
    async updateUser(_, { user, gameId }, { pubsub }) {
      const userToUpdate = new User(user);
      const updatedGame: Game = await userService.updateUser(
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
};