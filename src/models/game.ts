import { prop, getModelForClass, Ref, arrayProp } from "@typegoose/typegoose";
import { User } from "./User";
import { ObjectID } from "bson";
import * as shortid from "shortid";
import { SubmittedGif } from "./SubmittedGif";

export class Game {
  @prop({ default: shortid.generate })
  readonly _id: string;

  readonly id: string;

  @arrayProp({ items: User })
  users?: Array<Ref<User>> = [];

  @prop({ default: false })
  started: boolean;

  @prop({ default: "" })
  topic: string;

  @prop({ default: 0 })
  roundNumber: number;

  @arrayProp({ items: SubmittedGif })
  gifs: Array<Ref<SubmittedGif>>;

  constructor(game?: Partial<Game>) {
    Object.assign(this, game);
  }
}

export const GameModel = getModelForClass(Game, {
  schemaOptions: { timestamps: true },
});
