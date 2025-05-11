import { Controller, Post, Get, Body, Param, Req, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { BookSlotDto } from './dto/book-slot.dto';
import { CreateSchedulingLinkDto } from './dto/create-scheduling-link.dto';
import { Request } from 'express';

@Controller('scheduling')
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post('book')
  async bookSlot(@Req() req: Request, @Body() bookSlotDto: BookSlotDto) {
    if (!req.user?.token?.access_token) {
      throw new UnauthorizedException('Access token is required');
    }

    return this.schedulingService.bookSlot(req.user.token.access_token, bookSlotDto);
  }

  @Post('links')
  async createSchedulingLink(@Body() createLinkDto: CreateSchedulingLinkDto) {
    return this.schedulingService.createSchedulingLink(createLinkDto);
  }

  @Get('links/:id/times')
  async getAvailableTimesForLink(@Param('id') id: string, @Body('date') date: string) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    return this.schedulingService.getAvailableTimesForLink(id, date);
  }
} 