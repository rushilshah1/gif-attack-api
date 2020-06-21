import { gql } from "apollo-server-express";
import { logger } from "../common";
import { SubmittedGif } from "../models/SubmittedGif";
import { Game } from "../models/Game";
import gifService from "../services/gif.service";

const GAME_STATE_CHANGED = "GAME_STATE_CHANGED";
// const GIF_DELETED = "GIF_DELETED";
// const VOTE_ADDED = "VOTE_ADDED";
// const VOTE_REMOVED = "VOTE_REMOVED";

//gif is actually a big object will be stringified and parsed using String
export const typeDefs = gql`
  type Gif {
    id: ID!
    gifId: ID!
    content: String!
    userId: ID!
    gifSearchText: String!
    numVotes: Int!
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
  }
  extend type Mutation {
    createGif(gif: AddGifInput!, gameId: ID!): Gif
    removeGif(gif: ModifyGifInput!, gameId: ID!): Gif
    updateGif(gif: ModifyGifInput!, gameId: ID!): Gif
  }
  # extend type Subscription {
  #   gifChanged(gameId: ID!): Game
  # }
`;

export const resolvers = {
  Mutation: {
    async createGif(_, { gif, gameId }, { pubsub }) {
      const newGif: SubmittedGif = new SubmittedGif(gif);
      const game: Game = await gifService.addSubmittedGif(gameId, newGif);
      await pubsub.publish(GAME_STATE_CHANGED, {
        gameStateChanged: game,
      });
      logger.info("Gif Submited/Created");
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
  },
  Subscription: {
    // gifChanged: {
    //   subscribe: withFilter(
    //     (parent, args, { pubsub }) => pubsub.asyncIterator(["GIF_CHANGED"]),
    //     (payload, variables) => {
    //       logger.info("Gif Changed subscription started");
    //       return payload.gameStateChanged.id === variables.gameId;
    //     }
    //   ),
    // },
  },
};
