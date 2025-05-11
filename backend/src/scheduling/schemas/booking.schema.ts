import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class Slot {
  @Prop({ required: true })
  start: string;

  @Prop({ required: true })
  end: string;
}

export const SlotSchema = SchemaFactory.createForClass(Slot);

@Schema({ timestamps: true })
export class Booking extends Document {
  @Prop({ required: true })
  slotId: string;

  @Prop({ required: true })
  email: string;

  @Prop({ type: [String], default: [] })
  answers: string[];

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ required: true })
  eventId: string;

  @Prop({ type: SlotSchema, required: true })
  slot: Slot;

  @Prop({ required: true })
  schedulingLinkId: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking); 