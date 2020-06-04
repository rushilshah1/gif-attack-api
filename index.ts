// configuring environment variables
import * as dotenv from "dotenv";
import * as express from "express";
import { createServer } from "http";
import { ApolloServer, PubSub } from "apollo-server-express";
import { typeDefs, resolvers, context } from "./src/graphql";
import { database } from "./src/common/db";
import { logger } from "./src/common/logger";
import * as cors from "cors";
import * as os from "os";

dotenv.config();
const PORT = 4000;

const connectToDB = async () => {
  try {
    return database.connect();
  } catch (err) {
    logger.fatal(
      `Error connecting to database. Please make sure database is running. ${err}`
    );
    throw err;
  }
};

const app = express();
const pubsub = new PubSub();

app.use(cors());
//Configure simple health check
app.get("/", function (req, res) {
  res.send({
    message: "Server is up and running",
    environment: process.env.ENV,
  });
});

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context,
});
apolloServer.applyMiddleware({
  app,
  cors: {
    credentials: true,
    origin: true,
  },
});

const httpServer = createServer(app);
apolloServer.installSubscriptionHandlers(httpServer);

// start listening
connectToDB()
  .then(async () => {
    httpServer.listen({ port: PORT }, () => {
      console.log(
        `🚀 Server ready in ${
          process.env.ENV
        } at ${os.hostname()} on port ${PORT}`
      );
      console.log(
        `🚀 Subscriptions ready in ${
          process.env.ENV
        } at ${os.hostname()} on port ${PORT}`
      );
    });
  })
  .catch((err) => logger.error(`Error connecting to database: ${err}`));
