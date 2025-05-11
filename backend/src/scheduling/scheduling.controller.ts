import { Controller, Post, Body, Req, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { BookSlotDto } from './dto/book-slot.dto';
import { CreateSchedulingLinkDto } from './dto/create-scheduling-link.dto';
import { RequestWithUser } from '../types/express';

@Controller('scheduling')
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post('book')
  async bookSlot(@Body() bookSlotDto: BookSlotDto, @Req() req: RequestWithUser) {
    if (!req.user?.id) {
      throw new UnauthorizedException('User ID is required');
    }

    return this.schedulingService.bookSlot(req.user.id, bookSlotDto);
  }

  @Post('create-link')
  async createSchedulingLink(@Body() createLinkDto: CreateSchedulingLinkDto, @Req() req: RequestWithUser) {
    if (!req.user?.id) {
      throw new UnauthorizedException('User ID is required');
    }

    return this.schedulingService.createSchedulingLink(createLinkDto, req.user.id);
  }

  @Post('available-times')
  async getAvailableTimesForLink(
    @Body('linkId') linkId: string,
    @Body('date') date: string,
    @Req() req: RequestWithUser,
  ) {
    if (!req.user?.id) {
      throw new UnauthorizedException('User ID is required');
    }

    return this.schedulingService.getAvailableTimesForLink(linkId, date);
  }
} 