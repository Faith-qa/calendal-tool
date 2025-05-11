import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';
import { CalendarModule } from '../calendar/calendar.module';
import { SchedulingLink, SchedulingLinkSchema } from '@/scheduling/schemas/scheduling-link.schema';
import { Booking, BookingSchema } from '@/scheduling/schemas/booking.schema';

@Module({
  imports: [
    ConfigModule.forRoot(),
    CalendarModule,
    MongooseModule.forFeature([
      { name: SchedulingLink.name, schema: SchedulingLinkSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
  ],
  controllers: [SchedulingController],
  providers: [SchedulingService],
  exports: [SchedulingService],
})
export class SchedulingModule {} 