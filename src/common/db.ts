import { Connection, createConnection } from "mongoose";
import * as mongoose from "mongoose";
import { logger } from "./logger";

export class Database {
  dbConnection: Connection | null = null;

  async connect(): Promise<boolean> {
    // if (this.dbConnection) {
    //     return this.dbConnection
    // }
    const MONGO_USER = process.env.MONGO_USER;
    const MONGO_PASS = process.env.MONGO_PASS;
    const MONGO_HOST = process.env.MONGO_HOST;
    const MONGO_PORT = process.env.MONGO_PORT;
    const MONGO_DB = process.env.MONGO_DB;

    const userPassCombination =
      MONGO_USER && MONGO_PASS ? `${MONGO_USER}:${MONGO_PASS}@` : "";

    const mongoUrl = `mongodb://${userPassCombination}${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;
    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    };
    logger.info(
      `Attempting to connect to mongodb at ${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}...`
    );
    await mongoose.connect(mongoUrl, connectionOptions);
    //this.dbConnection = await createConnection(mongoUrl, connectionOptions);
    logger.info(
      `Connected to mongodb at ${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`
    );

    return true;
    //return this.dbConnection;
  }
}

export const database = new Database();
