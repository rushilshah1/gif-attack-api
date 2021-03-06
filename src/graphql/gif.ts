import { gql } from "apollo-server-express";
import { logger, GAME_STATE_CHANGED } from "../common";
import { SubmittedGif } from "../models/SubmittedGif";
import { Game } from "../models/Game";
import gifService from "../services/gif.service";
import userService from "../services/user.service";

//content is actually a big object will be stringified and parsed back on the UI to render gif content
export const typeDefs = gql`
  type Gif {
    id: ID!
    gifId: ID!
    content: String!
    userId: ID!
    gifSearchText: String!
    numVotes: Int!
    isWinner: Boolean!
  }
  input AddGifInput {
    gifId: ID!
    content: String!
    userId: ID!
    gifSearchText: String
  }

  input ModifyGifInput {
    id: ID!
    gifId: ID!
    content: String!
    userId: ID!
    gifSearchText: String!
    numVotes: Int!
    isWinner: Boolean!
  }
  extend type Mutation {
    createGif(gif: AddGifInput!, gameId: ID!, userId: ID!): Gif
    removeGif(gif: ModifyGifInput!, gameId: ID!): Gif
    updateGif(gif: ModifyGifInput!, gameId: ID!): Gif
    voteForGif(gifId: ID!, gameId: ID!, userId: ID!): Gif
  }
`;

export const resolvers = {
  Mutation: {
    async createGif(_, { gif, gameId, userId }, { pubsub }) {
      const newGif: SubmittedGif = new SubmittedGif(gif);
      const game: Game = await gifService.addSubmittedGif(gameId, newGif, userId, pubsub);
      await pubsub.publish(GAME_STATE_CHANGED, {
        gameStateChanged: game,
      });
      return game.submittedGifs[game.submittedGifs.length - 1];
    },
    async removeGif(_, { gif, gameId }, { pubsub }) {
      const deleteGif: SubmittedGif = new SubmittedGif(gif);
      const game: Game = await gifService.removeSubmittedGif(gameId, deleteGif);
      await pubsub.publish(GAME_STATE_CHANGED, {
        gameStateChanged: game,
      });
      return gif;
    },
    async updateGif(_, { gif, gameId }, { pubsub }) {
      const updatedGif: SubmittedGif = new SubmittedGif(gif);
      const game: Game = await gifService.updateSubmittedGif(
        gameId,
        updatedGif
      );
      await pubsub.publish(GAME_STATE_CHANGED, {
        gameStateChanged: game,
      });
      return game.submittedGifs.find(
        (submittedGif: SubmittedGif) => submittedGif.id === gif.id
      );
    },
    async voteForGif(_, { gifId, gameId, userId }, { pubsub }) {
      const game: Game = await gifService.voteForGif(
        gameId,
        gifId,
        userId
      );
      await pubsub.publish(GAME_STATE_CHANGED, {
        gameStateChanged: game,
      });
      return game.submittedGifs.find(
        (submittedGif: SubmittedGif) => submittedGif.id === gifId
      );
    }
  },
};
