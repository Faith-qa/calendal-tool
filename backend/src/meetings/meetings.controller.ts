import { Controller, Get, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../types/express';

@Controller('meetings')
export class MeetingsController {
    constructor(private readonly meetingsService: MeetingsService) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(@Req() req: RequestWithUser): Promise<any[]> {
        if (!req.user || !req.user.accessToken) {
            throw new UnauthorizedException('Invalid user or access token');
        }
        return this.meetingsService.getUserMeetings(req.user.accessToken);
    }
}