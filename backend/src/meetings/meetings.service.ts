import { Injectable, UnauthorizedException } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class MeetingsService {
    async getUserMeetings(user: any): Promise<any[]> {
        if (!user || !user.googleAccounts || user.googleAccounts.length === 0) {
            throw new UnauthorizedException('No Google accounts connected');
        }

        const allEvents: any[] = [];

        for (const account of user.googleAccounts) {
            const { email, accessToken } = account;
            if (!accessToken) {
                console.warn(`Skipping account ${email}: No access token available`);
                continue;
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
                const formattedEvents = events.map((event) => ({
                    id: event.id,
                    title: event.summary,
                    startTime: event.start?.dateTime || event.start?.date,
                    endTime: event.end?.dateTime || event.end?.date,
                    description: event.description,
                    accountEmail: email, // Add account email to identify the source
                }));
                allEvents.push(...formattedEvents);
            } catch (error) {
                console.error(`Google Calendar API error for account ${email}:`, {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data ? JSON.stringify(error.response.data, null, 2) : 'No response data',
                });
                // Continue to the next account instead of failing entirely
                continue;
            }
        }

        if (allEvents.length === 0) {
            console.warn('No events fetched from any Google account');
        }

        return allEvents;
    }
}