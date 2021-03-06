import { prop } from "@typegoose/typegoose";
import { ObjectID } from "bson";

export class SubmittedGif {
  readonly _id: ObjectID;
  readonly id: ObjectID;

  @prop()
  gifId: string;

  @prop()
  content: string;

  @prop({ default: "" })
  gifSearchText: string;

  @prop()
  userId: string;

  @prop({ default: 0 })
  numVotes: number;

  @prop({ default: false })
  isWinner: boolean;

  constructor(gif?: Partial<SubmittedGif>) {
    Object.assign(this, gif);
  }
}
