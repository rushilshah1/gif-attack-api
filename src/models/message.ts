import { prop, getModelForClass } from "@typegoose/typegoose";

interface IMessage {
    id?: string;
    text?: string;
    isFavorite?: boolean;
}

export class Message {
    /* Uses typegoose decorators because it is linked with mongoose */
    @prop({ required: true, unique: true })
    id!: string;

    @prop({ required: true })
    text!: string;

    @prop()
    isFavorite?: boolean;

    constructor(message?: IMessage) {
        this.id = message && message.id || '';
        this.text = message && message.text || '';
        this.isFavorite = message && (typeof message.isFavorite !== 'undefined' && message.isFavorite) || false;
    }
}

export const MessageModel = getModelForClass(Message, { schemaOptions: { timestamps: true } });
