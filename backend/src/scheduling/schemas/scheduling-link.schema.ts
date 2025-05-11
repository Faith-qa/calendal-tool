import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class SchedulingLink extends Document {
  @Prop({ required: true })
  meetingLength: number;

  @Prop({ required: true })
  maxDaysInAdvance: number;

  @Prop({ type: [String], default: [] })
  questions: string[];

  @Prop()
  maxUses?: number;

  @Prop()
  expiresAt?: Date;

  @Prop({ default: 0 })
  uses: number;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ required: true, default: 9 })
  startHour: number;

  @Prop({ required: true, default: 17 })
  endHour: number;
}

export const SchedulingLinkSchema = SchemaFactory.createForClass(SchedulingLink); 