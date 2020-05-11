import { gql } from "apollo-server-express";
import { PubSub, withFilter } from "apollo-server";
import { InstanceType } from "typegoose";
import { logger } from "../common";
import { MessageModel, Message } from "../models/message";
require("dotenv").config();

const MESSAGE_CREATED = "MESSAGE_CREATED";
const MESSAGE_UPDATED = "MESSAGE_UPDATED";

const pubsub = new PubSub();

export const typeDefs = gql`
  type Message {
    id: Int!
    text: String!
    isFavorite: Boolean!
  }
  extend type Query {
    allMessages: [Message]
    fetchMessage(id: Int!): Message
  }
  extend type Mutation {
    createMessage(text: String!, id: Int!, isFavorite: Boolean!): Message
  }
  extend type Subscription {
    messageCreated: Message
  }
`;

export const resolvers = {
  Query: {
    async allMessages(parent, args, context, info): Promise<Array<Message>> {
      logger.info("Retrieving messages");
      return MessageModel.find({});
    },
    async fetchMessage(_, { id }): Promise<Message | null> {
      return MessageModel.findById(id);
    },
  },
  Mutation: {
    async createMessage(_, { text, id, isFavorite }) {
      const messageModel: InstanceType<Message> = new MessageModel({
        id: id,
        text: text,
        isFavorite: false,
      });
      const newMessage: Message = await messageModel.save();
      await pubsub.publish(MESSAGE_CREATED, { messageCreated: newMessage });
      return newMessage;
    },
    // async updateMessage(_, { id, text, isFavorite }) {
    //     const message = await Message.findById(id);
    //     await message.update({ text, isFavorite })
    //         .then(message => {
    //             pubsub.publish(MESSAGE_UPDATED, { messageUpdated: message });
    //         });
    //     return message;
    // },
  },
  Subscription: {
    messageCreated: {
      subscribe: () => pubsub.asyncIterator([MESSAGE_CREATED]),
    },
    // messageUpdated: {
    //     subscribe: withFilter(
    //         () => pubsub.asyncIterator('MESSAGE_UPDATED'),
    //         (payload, variables) => {
    //             return payload.messageUpdated.id === variables.id;
    //         },
    //     ),
    // },
  },
};
