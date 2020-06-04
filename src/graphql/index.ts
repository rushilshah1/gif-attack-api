import { gql, addErrorLoggingToSchema, PubSub } from "apollo-server-express";
import * as message from "./message";
import * as topic from "./topic";
import * as gif from "./gif";
import * as game from "./game";
import * as round from "./round";
import { merge } from "lodash";
import { logger } from "../common";

const pubsub = new PubSub();

const defaultTypeDefs = gql`
  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }

  type Subscription {
    _empty: String
  }
`;

export const typeDefs = [
  defaultTypeDefs,
  topic.typeDefs,
  gif.typeDefs,
  game.typeDefs,
  round.typeDefs,
];
export const resolvers = merge(
  topic.resolvers,
  gif.resolvers,
  game.resolvers,
  round.resolvers
);
export const context = ({ req, connection }) => {
  let user: string = "";
  if (req) {
    logger.info(`HTTP request ${req.headers.authorization}`);
    user = req.headers.authorization || "";
  }
  if (connection) {
    logger.info(`WS connection ${connection.context.user}`);
    user = connection.context.user || "";
  }
  return { user, pubsub };
};
