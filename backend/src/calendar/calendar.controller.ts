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
import { IsISO8601 } from 'class-validator';
import { ValidationPipe } from '@nestjs/common';

class DateQueryDto {
  @IsISO8601()
  date: string;
}

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('slots')
  async getAvailableSlots(
    @Req() req: Request,
    @Query(ValidationPipe) dateQuery: DateQueryDto,
    @Query('startHour', ParseIntPipe) startHour: number,
    @Query('endHour', ParseIntPipe) endHour: number,
    @Query('slotDuration', ParseIntPipe) slotDuration: number,
    @Query('timeZone') timeZone?: string,
  ) {
    // Extract access token from the OAuth flow result
    const accessToken = req.user?.['token']?.access_token;
    if (!accessToken) {
      throw new UnauthorizedException('Access token not found');
    }

    try {
      // Validate date format
      const date = new Date(dateQuery.date);
      if (isNaN(date.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(dateQuery.date)) {
        throw new BadRequestException('Invalid date format. Please use ISO 8601 format (YYYY-MM-DD)');
      }

      return await this.calendarService.getAvailableSlots(
        accessToken,
        dateQuery.date,
        startHour,
        endHour,
        slotDuration,
        timeZone,
      );
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException(`Failed to get available slots: ${error.message}`);
    }
  }
} 