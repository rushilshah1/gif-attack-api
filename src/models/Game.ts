import * as shortid from "shortid";
import { prop, getModelForClass, Ref, arrayProp, index } from "@typegoose/typegoose";
import { User } from "./User";
import { SubmittedGif } from "./SubmittedGif";

@index({ "createdAt": 1 }, { expireAfterSeconds: 14400 })
export class Game {
  readonly id: string;
  readonly updatedAt: Date;
  readonly createdAt: Date;

  @prop({ default: shortid.generate })
  readonly _id: string;

  @arrayProp({ items: User })
  users: Array<Ref<User>> = [];
  //Indicates if game is started or not;
  @prop({ default: false })
  gameStarted: boolean;
  //Indicates if gif submissions are active; meaning voting cannot happen yet
  @prop({ default: false })
  submissionActive: boolean;
  //Indicates if the round is still active; meaning round results cannot be displayed
  @prop({ default: false })
  roundActive: boolean;
  /*
  roundActive = true
    submissionActive = true -> gif submissions will continue till timer expires or everyone has submitted
    submissionActive = false and roundActive = true -> voting is allowed till time expires or everyone has voted
  roundActive = false
    round results will be displayed and users cannot submit/vote
  */
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