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
    id: ID
    gif: String
    gameId: ID!
    userName: String
    gifSearchText: String
    numVotes: Int
  }
  input GifInput {
    id: ID!
    gif: String!
    gameId: ID!
    userName: String!
    gifSearchText: String
    numVotes: Int
  }

  extend type Mutation {
    createGif(input: GifInput!): Gif
    removeGif(input: GifInput!): Gif
    updateGif(input: GifInput!): Gif
    # votedForGif(input: GifInput!): Gif
    # unvotedForGif(input: GifInput!): Gif
  }
  extend type Subscription {
    gifChanged(gameId: ID!): Gif
    # gifCreated(gameId: ID!): Gif
    # gifDeleted(gameId: ID!): Gif
    # gifVoteAdded(gameId: ID!): Gif
    # gifVoteRemoved(gameId: ID!): Gif
  }
`;

export const resolvers = {
  Mutation: {
    async createGif(_, { input }, { pubsub }) {
      const newGif: SubmittedGif = new SubmittedGif(input);
      const game: Game = await gameAttributesService.addSubmittedGif(
        input.gameId,
        newGif
      );
      await pubsub.publish(GIF_CHANGED, {
        gifChanged: input,
      });
      logger.info("Gif Submited/Created");
      return input;
    },
    async removeGif(_, { input }, { pubsub }) {
      const deleteGif: SubmittedGif = new SubmittedGif(input);
      const game: Game = await gameAttributesService.removeSubmittedGif(
        input.gameId,
        deleteGif
      );
      await pubsub.publish(GIF_CHANGED, {
        gifChanged: input,
      });
      return input;
    },
    async updateGif(_, { input }, { pubsub }) {
      const updatedGif: SubmittedGif = new SubmittedGif(input);
      const game: Game = await gameAttributesService.updateSubmittedGif(
        input.gameId,
        updatedGif
      );
      await pubsub.publish(GIF_CHANGED, {
        gifChanged: input,
      });
      return input;
    },
  },
  Subscription: {
    gifChanged: {
      subscribe: withFilter(
        (parent, args, { pubsub }) => pubsub.asyncIterator([GIF_CHANGED]),
        (payload, variables) => {
          logger.info("Gif Changed subscription started");
          return payload.gifCreated.gameId === variables.gameId;
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
