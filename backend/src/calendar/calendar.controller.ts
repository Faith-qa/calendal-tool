import {
  Controller,
  Get,
  Query,
  Req,
  UnauthorizedException,
  BadRequestException,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../types/express';
import { IsString, Matches, IsInt, Min, Max } from 'class-validator';
import { ValidationPipe } from '@nestjs/common';

class DateQueryDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  date: string;

  @IsInt()
  @Min(0)
  @Max(23)
  startHour: number;

  @IsInt()
  @Min(0)
  @Max(24)
  endHour: number;

  @IsInt()
  @Min(5)
  @Max(120)
  slotDuration: number;
}

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @UseGuards(JwtAuthGuard)
  @Get('available-slots')
  async getAvailableSlots(
      @Req() req: RequestWithUser,
      @Query(new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true }
      })) query: DateQueryDto,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('Invalid user');
    }

    if (query.endHour <= query.startHour) {
      throw new BadRequestException('End hour must be greater than start hour');
    }

    if (query.slotDuration % 5 !== 0) {
      throw new BadRequestException('Slot duration must be a multiple of 5 minutes');
    }

    try {
      const date = new Date(query.date);
      if (isNaN(date.getTime())) {
        throw new BadRequestException('Invalid date format');
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new BadRequestException('Cannot book slots in the past');
      }

      return await this.calendarService.getAvailableSlots(
          req.user, // Pass the full user object
          query.date,
          query.startHour,
          query.endHour,
          query.slotDuration,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }
}