import { gql } from "apollo-server-express";
import { PubSub, withFilter } from "apollo-server";
import { logger } from "../common";

const GIF_CREATED = "GIF_CREATED";
const GIF_DELETED = "GIF_DELETED";
const VOTE_ADDED = "VOTE_ADDED";
const VOTE_REMOVED = "VOTE_REMOVED";

//Gif Images is actually a huge json, but for simplicity will be stringified
export const typeDefs = gql`
  type Gif {
    id: String!
    images: String
    gameId: String!
  }
  input GifInput {
    id: String!
    images: String
    gameId: String!
  }

  extend type Mutation {
    createGif(input: GifInput!): Gif
    deleteGif(input: GifInput!): Gif
    votedForGif(input: GifInput!): Gif
    unvotedForGif(input: GifInput!): Gif
  }
  extend type Subscription {
    gifCreated(gameId: String!): Gif
    gifDeleted(gameId: String!): Gif
    gifVoteAdded(gameId: String!): Gif
    gifVoteRemoved(gameId: String!): Gif
  }
`;

export const resolvers = {
  Mutation: {
    async createGif(_, { input }, { pubsub }) {
      await pubsub.publish(GIF_CREATED, {
        gifCreated: input,
      });
      return input;
    },
    async deleteGif(_, { input }, { pubsub }) {
      await pubsub.publish(GIF_DELETED, {
        gifDeleted: input,
      });
      return input;
    },
    async votedForGif(_, { input }, { pubsub }) {
      await pubsub.publish(VOTE_ADDED, {
        gifVoteAdded: input,
      });
      return input;
    },
    async unvotedForGif(_, { input }, { pubsub }) {
      await pubsub.publish(VOTE_REMOVED, {
        gifVoteRemoved: input,
      });
      return input;
    },
  },
  Subscription: {
    gifCreated: {
      subscribe: withFilter(
        (parent, args, { pubsub }) => pubsub.asyncIterator([GIF_CREATED]),
        (payload, variables) => {
          return payload.gifCreated.gameId === variables.gameId;
        }
      ),
    },
    gifDeleted: {
      subscribe: withFilter(
        (parent, args, { pubsub }) => pubsub.asyncIterator([GIF_DELETED]),
        (payload, variables) => {
          return payload.gifDeleted.gameId === variables.gameId;
        }
      ),
    },
    gifVoteAdded: {
      subscribe: withFilter(
        (parent, args, { pubsub }) => pubsub.asyncIterator([VOTE_ADDED]),
        (payload, variables) => {
          return payload.gifVoteAdded.gameId === variables.gameId;
        }
      ),
    },
    gifVoteRemoved: {
      subscribe: withFilter(
        (parent, args, { pubsub }) => pubsub.asyncIterator([VOTE_REMOVED]),
        (payload, variables) => {
          return payload.gifVoteRemoved.gameId === variables.gameId;
        }
      ),
    },
  },
};
