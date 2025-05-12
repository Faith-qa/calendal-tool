import { Controller, Get, Post, Req, Body, UnauthorizedException, UseGuards, BadRequestException } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../types/express';

@Controller('meetings')
export class MeetingsController {
    constructor(private readonly meetingsService: MeetingsService) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(@Req() req: RequestWithUser): Promise<any> {
        if (!req.user) {
            throw new UnauthorizedException('Invalid user');
        }
        const calendarEvents = await this.meetingsService.getUserMeetings(req.user);
        const hubspotContacts = await this.meetingsService.getHubSpotContacts(req.user);
        return { calendarEvents, hubspotContacts };
    }

    @UseGuards(JwtAuthGuard)
    @Post('book')
    async bookMeeting(
        @Req() req: RequestWithUser,
        @Body('start') start: string,
        @Body('end') end: string,
        @Body('title') title: string,
        @Body('accountEmail') accountEmail: string,
    ): Promise<any> {
        if (!req.user) {
            throw new UnauthorizedException('Invalid user');
        }
        if (!start || !end || !title || !accountEmail) {
            throw new BadRequestException('Missing required fields: start, end, title, accountEmail');
        }
        return this.meetingsService.bookMeeting(req.user, start, end, title, accountEmail);
    }
}