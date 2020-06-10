import { prop, getModelForClass, Ref, arrayProp } from "@typegoose/typegoose";
import { User } from "./user";
import { ObjectID } from "bson";
import * as shortid from "shortid";

export class Game {
  @prop({ default: shortid.generate })
  readonly _id: string;

  readonly id: string;

  @arrayProp({ items: User })
  users?: Array<Ref<User>> = [];

  @prop({ default: false })
  started: boolean;

  constructor(game?: Partial<Game>) {
    Object.assign(this, game);
  }
}

export const GameModel = getModelForClass(Game, {
  schemaOptions: { timestamps: true },
});
