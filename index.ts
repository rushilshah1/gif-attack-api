// configuring environment variables
import * as dotenv from "dotenv"
import * as express from 'express';
import { createServer } from 'http';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs, resolvers, context } from './src/graphql';
import { database } from './src/common/db'
import { logger } from "./src/common/logger";

dotenv.config();
const PORT = 4000;

const connectToDB = async () => {
  try {
    return database.connect();
  }
  catch (err) {
    logger.fatal(`Error connecting to database. Please make sure database is running. ${err}`);
    throw err;
  }
};

const app = express();
const apolloServer = new ApolloServer({ typeDefs, resolvers, context });
apolloServer.applyMiddleware({ app });

const httpServer = createServer(app);
apolloServer.installSubscriptionHandlers(httpServer);

// start listening
connectToDB()
  .then(async () => {
    httpServer.listen({ port: PORT }, () => {
      console.log(`🚀 Server ready at http://localhost:${PORT}${apolloServer.graphqlPath}`)
      console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}${apolloServer.subscriptionsPath}`)
    })
  })
  .catch(err => logger.error(`Error connecting to database: ${err}`));

