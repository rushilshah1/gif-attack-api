import * as dotenv from "dotenv";
import * as express from "express";
import * as cors from "cors";
import * as os from "os";
import * as bodyParser from 'body-parser';
import { createServer } from "http";
import { ApolloServer, PubSub } from "apollo-server-express";
import { typeDefs, resolvers, context } from "./src/graphql";
import { database } from "./src/common/db";
import { logger } from "./src/common/logger";

dotenv.config();
const PORT = 4000;

const connectToDB = async (): Promise<boolean> => {
  try {
    return database.connect();
  } catch (err) {
    logger.fatal(`Error connecting to database. Please make sure database is running. ${err}`);
    process.exit(1);
  }
};

const app = express();
app.use(cors({ credentials: true, origin: process.env.WHITELISTED_ORIGIN.split(",") }));
app.use(bodyParser.json());
app.use(bodyParser.text());

//Health check
app.get("/", function (req, res) {
  res.send({
    message: "Server is up and running!",
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
    origin: process.env.WHITELISTED_ORIGIN.split(","),
  },
});

const httpServer = createServer(app);
apolloServer.installSubscriptionHandlers(httpServer);

connectToDB()
  .then(async () => {
    httpServer.listen({ port: PORT }, () => {
      logger.info(`🚀 Server ready in ${process.env.ENV} at ${os.hostname()} on port ${PORT}`);
      logger.info(`🚀 Subscriptions ready in ${process.env.ENV} at ${os.hostname()} on port ${PORT}`);
    });
  })
  .catch((err) => logger.error(`Error connecting to database: ${err}`));
