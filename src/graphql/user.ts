import { gql } from "apollo-server-express";
import { logger, GAME_STATE_CHANGED } from "../common";
import { Game } from "../models/Game";
import { User } from "../models/User";
import userService from "../services/user.service";

export const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    score: Int!
    hasSubmitted: Boolean!
    votedGif: String!
  }
  input AddUserInput {
    name: String!
    score: Int
  }
  input ModifyUserInput {
    id: ID!
    name: String!
    score: Int!
    hasSubmitted: Boolean!
    votedGif: String!
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
      const addedUser: User = new User({ name: user.name, score: 0, hasSubmitted: false, votedGif: '' });
      const updatedGame: Game = await userService.addUser(gameId, addedUser);
      await pubsub.publish(GAME_STATE_CHANGED, {
        gameStateChanged: updatedGame,
      });
      //Newest is added to end
      return updatedGame.users[updatedGame.users.length - 1];
    },
    async removeUser(_, { user, gameId }, { pubsub }) {
      const userId: string = user.id;
      const updatedGame: Game = await userService.removeUser(gameId, userId);
      await pubsub.publish(GAME_STATE_CHANGED, {
        gameStateChanged: updatedGame,
      });
      return user;
    },
    async updateUser(_, { user, gameId }, { pubsub }) {
      const userToUpdate = new User(user);
      const updatedGame: Game = await userService.updateUser(gameId, userToUpdate);
      await pubsub.publish(GAME_STATE_CHANGED, {
        gameStateChanged: updatedGame,
      });
      return updatedGame.users.find((gamePlayer: User) => user.id === gamePlayer.id);
    },
  },
};
