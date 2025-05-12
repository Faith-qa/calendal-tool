import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module';
import { CalendarModule } from './calendar/calendar.module';
import {MeetingsModule} from "@/meetings/meetings.module";

@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggerModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/calendly-tool'),
    AuthModule,
    CalendarModule,
    MeetingsModule,
  ],
})
export class AppModule {}
