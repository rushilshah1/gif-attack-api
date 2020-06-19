import { gql } from "apollo-server-express";
import { PubSub, withFilter } from "apollo-server";
import { logger } from "../common";
import { SubmittedGif } from "../models/SubmittedGif";
import gameAttributesService from "../services/game-attributes.service";
import { Game } from "../models/Game";

const GIF_CHANGED = "GIF_CHANGED";
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
    # votedForGif(input: GifInput!): Gif
    # unvotedForGif(input: GifInput!): Gif
  }
  extend type Subscription {
    gifChanged(gameId: ID!): Game
    # gifCreated(gameId: ID!): Gif
    # gifDeleted(gameId: ID!): Gif
    # gifVoteAdded(gameId: ID!): Gif
    # gifVoteRemoved(gameId: ID!): Gif
  }
`;

export const resolvers = {
  Mutation: {
    async createGif(_, { gif, gameId }, { pubsub }) {
      const newGif: SubmittedGif = new SubmittedGif(gif);
      const game: Game = await gameAttributesService.addSubmittedGif(
        gameId,
        newGif
      );
      await pubsub.publish(GIF_CHANGED, {
        gifChanged: game,
      });
      logger.info("Gif Submited/Created");
      return game.submittedGifs[game.submittedGifs.length - 1];
    },
    async removeGif(_, { gif, gameId }, { pubsub }) {
      const deleteGif: SubmittedGif = new SubmittedGif(gif);
      const game: Game = await gameAttributesService.removeSubmittedGif(
        gameId,
        deleteGif
      );
      await pubsub.publish(GIF_CHANGED, {
        gifChanged: game,
      });
      return gif;
    },
    async updateGif(_, { gif, gameId }, { pubsub }) {
      const updatedGif: SubmittedGif = new SubmittedGif(gif);
      const game: Game = await gameAttributesService.updateSubmittedGif(
        gameId,
        updatedGif
      );
      await pubsub.publish(GIF_CHANGED, {
        gifChanged: game,
      });
      return game.submittedGifs.find(
        (submittedGif: SubmittedGif) => submittedGif.id === gif.id
      );
    },
  },
  Subscription: {
    gifChanged: {
      subscribe: withFilter(
        (parent, args, { pubsub }) => pubsub.asyncIterator([GIF_CHANGED]),
        (payload, variables) => {
          logger.info("Gif Changed subscription started");
          return payload.gifChanged.id === variables.gameId;
        }
      ),
    },
    //  gifDeleted: {
    //    subscribe: withFilter(
    //      (parent, args, { pubsub }) =>
    //        pubsub.asyncIterator([GIF_CHANGED]),
    //      (payload, variables) => {
    //        return payload.gifDeleted.gameId === variables.gameId;
    //      }
    //    ),
    //  },
    //  gifVoteAdded: {
    //    subscribe: withFilter(
    //      (parent, args, { pubsub }) => pubsub.asyncIterator([VOTE_ADDED]),
    //      (payload, variables) => {
    //        logger.info("Gif Vote subscription started");
    //        return payload.gifVoteAdded.gameId === variables.gameId;
    //      }
    //    ),
    //  },
    //  gifVoteRemoved: {
    //    subscribe: withFilter(
    //      (parent, args, { pubsub }) =>
    //        pubsub.asyncIterator([VOTE_REMOVED]),
    //      (payload, variables) => {
    //        return payload.gifVoteRemoved.gameId === variables.gameId;
    //      }
    //    ),
    //  },
  },
};
