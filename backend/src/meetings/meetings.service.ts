import { Injectable, UnauthorizedException } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class MeetingsService {
    async getUserMeetings(accessToken: string): Promise<any[]> {
        if (!accessToken) {
            throw new UnauthorizedException('Access token is required');
        }

        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });

        const calendar = google.calendar({ version: 'v3', auth });

        try {
            const response = await calendar.events.list({
                calendarId: 'primary',
                timeMin: new Date().toISOString(),
                maxResults: 100,
                singleEvents: true,
                orderBy: 'startTime',
            });

            const events = response.data.items || [];
            return events.map((event) => ({
                id: event.id,
                title: event.summary,
                startTime: event.start?.dateTime || event.start?.date,
                endTime: event.end?.dateTime || event.end?.date,
                description: event.description,
            }));
        } catch (error) {
            console.error('Google Calendar API error:', error.message);
            throw new UnauthorizedException('Failed to fetch calendar events: ' + error.message);
        }
    }
}