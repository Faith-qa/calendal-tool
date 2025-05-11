import {
  Controller,
  Get,
  Query,
  Req,
  UnauthorizedException,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { Request } from 'express';
import { IsString, Matches } from 'class-validator';
import { ValidationPipe } from '@nestjs/common';

class DateQueryDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  date: string;
}

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('available-slots')
  async getAvailableSlots(
    @Req() req: Request,
    @Query() query: DateQueryDto,
    @Query('startHour', ParseIntPipe) startHour: number,
    @Query('endHour', ParseIntPipe) endHour: number,
    @Query('slotDuration', ParseIntPipe) slotDuration: number,
  ) {
    if (!req.user?.token?.access_token) {
      throw new UnauthorizedException('Access token is required');
    }

    // Validate time range
    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 24 || endHour <= startHour) {
      throw new BadRequestException('Invalid time range');
    }
    // Validate slot duration
    if (slotDuration <= 0 || slotDuration > 120 || slotDuration % 5 !== 0) {
      throw new BadRequestException('Invalid slot duration');
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
        req.user.token.access_token,
        query.date,
        startHour,
        endHour,
        slotDuration,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }
} 