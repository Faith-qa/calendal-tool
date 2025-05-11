import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  googleId: string;

  @Prop({ type: [{ type: String }], default: [] })
  googleTokens: string[];

  @Prop()
  accessToken: string;
}

export const UserSchema = SchemaFactory.createForClass(User); 