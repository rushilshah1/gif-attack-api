import { gql, addErrorLoggingToSchema, PubSub } from "apollo-server-express";
import * as message from "./message";
import * as topic from "./topic";
import * as gif from "./gif";
import * as game from "./game";
import * as graphqlContext from "./context";
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
  message.typeDefs,
  topic.typeDefs,
  gif.typeDefs,
  game.typeDefs,
];
export const resolvers = merge(
  message.resolvers,
  topic.resolvers,
  gif.resolvers,
  game.resolvers
);
export const context = { pubsub };
