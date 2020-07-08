import { gql, addErrorLoggingToSchema, PubSub } from "apollo-server-express";
import * as topic from "./topic";
import * as gif from "./gif";
import * as game from "./game";
import * as round from "./round";
import * as user from "./user";
import { merge } from "lodash";

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
  user.typeDefs,
];
export const resolvers = merge(
  topic.resolvers,
  gif.resolvers,
  game.resolvers,
  round.resolvers,
  user.resolvers
);
export const context = ({ req, connection }) => {
  let user: string = "";
  if (req) {
    user = req.headers.authorization || "";
  }
  if (connection) {
    user = connection.context.user || "";
  }
  return { user, pubsub };
};
