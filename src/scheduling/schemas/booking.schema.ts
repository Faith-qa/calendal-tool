import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Booking extends Document {
  @Prop({ required: true })
  slotId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  slot: any;

  @Prop({ default: 'pending' })
  status: 'pending' | 'confirmed' | 'cancelled';
}

export const BookingSchema = SchemaFactory.createForClass(Booking); 