import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface GoogleAccount {
  email: string;
  accessToken: string;
  refreshToken?: string;
}

export interface HubSpotAccount {
  email: string;
  accessToken: string;
  refreshToken?: string;
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  googleId: string;

  @Prop({ type: [{ email: String, accessToken: String, refreshToken: String }], default: [] })
  googleAccounts: GoogleAccount[];

  @Prop({ type: [{ email: String, accessToken: String, refreshToken: String }], default: [] })
  hubspotAccounts: HubSpotAccount[];

  @Prop()
  accessToken: string;
}

export const UserSchema = SchemaFactory.createForClass(User);