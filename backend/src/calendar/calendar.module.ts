import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule

@Module({
  imports: [
    ConfigModule,
    AuthModule, // Import AuthModule to access UserModel
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}