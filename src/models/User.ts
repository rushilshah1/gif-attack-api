import { prop } from "@typegoose/typegoose";
import { ObjectID } from "bson";

export class User {
  readonly _id: ObjectID;
  readonly id: ObjectID;

  @prop()
  name: string;

  @prop({ default: 0 })
  score: number;

  @prop({ default: false })
  hasSubmitted: boolean;

  @prop({ default: '' })
  votedGif: string;

  constructor(user?: Partial<User>) {
    Object.assign(this, user);
  }
}
