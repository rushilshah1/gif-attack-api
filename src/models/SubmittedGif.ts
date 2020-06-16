import { prop, getModelForClass, Ref } from "@typegoose/typegoose";
import { ObjectID } from "bson";
import { User } from "./User";

export class SubmittedGif {
  @prop({ unique: true })
  id: string;

  @prop()
  gif: string;

  @prop({ default: "" })
  gifSearchText: string;

  @prop()
  userName: string;

  @prop({ default: 0 })
  numVotes: number;

  constructor(gif?: Partial<SubmittedGif>) {
    Object.assign(this, gif);
  }
}
