import { prop, getModelForClass, Ref, arrayProp, index } from "@typegoose/typegoose";
import { User } from "./User";
import * as shortid from "shortid";
import { SubmittedGif } from "./SubmittedGif";

@index({ "createdAt": 1 }, { expireAfterSeconds: 10800 })
export class Game {
  readonly id: string;
  readonly updatedAt: Date;
  readonly createdAt: Date;

  @prop({ default: shortid.generate })
  readonly _id: string;

  @arrayProp({ items: User })
  users: Array<Ref<User>> = [];

  @prop({ default: false })
  gameStarted: boolean;

  @prop({ default: false })
  roundActive: boolean;

  @prop({ default: "" })
  topic: string;

  @prop({ default: 0 })
  roundNumber: number;

  @arrayProp({ items: SubmittedGif })
  submittedGifs: Array<Ref<SubmittedGif>>;

  constructor(game?: Partial<Game>) {
    Object.assign(this, game);
  }
}

export const GameModel = getModelForClass(Game, {
  schemaOptions: { timestamps: true, autoIndex: true, autoCreate: true },
});