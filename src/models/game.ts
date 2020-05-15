import { prop, getModelForClass, Ref, arrayProp } from "@typegoose/typegoose";
import { User } from "./user";
import { ObjectID } from "bson";

export class Game {
  readonly _id: ObjectID;
  readonly id: ObjectID;

  @arrayProp({ items: User })
  users?: Array<Ref<User>> = [];

  constructor(game?: Partial<Game>) {
    Object.assign(this, game);
  }
}

export const GameModel = getModelForClass(Game, {
  schemaOptions: { timestamps: true },
});
