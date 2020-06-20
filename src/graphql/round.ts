import { gql } from "apollo-server-express";
import { withFilter } from "apollo-server";
import { logger } from "../common";
import gameAttributesService from "../services/game-attributes.service";
import { Game } from "../models/Game";
import { IRound } from "../models/Round";
import { GAME_STATE_CHANGED } from "./game";

const ROUND_CHANGED = "ROUND_CHANGED";

export const typeDefs = gql`
  type Round {
    roundNumber: Int!
    roundActive: Boolean!
  }
  input NewRoundInput {
    roundNumber: Int!
    roundActive: Boolean!
  }
  input UpdateRoundInput {
    roundActive: Boolean!
  }
  extend type Mutation {
    updateRoundStatus(round: UpdateRoundInput!, gameId: ID!): Boolean!
    newRound(round: NewRoundInput!, gameId: ID!): Round!
  }
  extend type Subscription {
    roundChanged(gameId: ID!): Game
  }
`;
//TODO: Have next roundROund mutation change roundNumber and clearSubmittedGifs
//Add roundActive field in game
//have roundChanged subscription return game?
export const resolvers = {
  Mutation: {
    async newRound(_, { round, gameId }, { pubsub }) {
      const game: Game = await gameAttributesService.newRound(gameId, round);
      await pubsub.publish(GAME_STATE_CHANGED, {
        gameStateChanged: game,
      });
      return game as IRound;
    },
    async updateRoundStatus(_, { round, gameId }, { pubsub }) {
      const game: Game = await gameAttributesService.updateRoundStatus(
        gameId,
        round
      );
      await pubsub.publish(ROUND_CHANGED, {
        roundChanged: game,
      });
      return game.roundActive;
    },
  },
  Subscription: {
    roundChanged: {
      subscribe: withFilter(
        (parent, variables, { pubsub, user }) =>
          pubsub.asyncIterator([ROUND_CHANGED]),
        (payload, variables, { pubsub, user }) => {
          return payload.roundChanged.id === variables.gameId;
        }
      ),
    },
  },
};
