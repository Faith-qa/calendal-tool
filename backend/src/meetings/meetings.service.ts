import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
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
                    accountEmail: email,
                }));
                allEvents.push(...formattedEvents);
            } catch (error) {
                console.error(`Google Calendar API error for account ${email}:`, {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data ? JSON.stringify(error.response.data, null, 2) : 'No response data',
                });
                continue;
            }
        }

        if (allEvents.length === 0) {
            console.warn('No events fetched from any Google account');
        }

        return allEvents;
    }

    async getHubSpotContacts(user: any): Promise<any[]> {
        if (!user || !user.hubspotAccounts || user.hubspotAccounts.length === 0) {
            return [];
        }

        const allContacts: any[] = [];

        for (const account of user.hubspotAccounts) {
            const { email, accessToken } = account;
            if (!accessToken) {
                console.warn(`Skipping HubSpot account ${email}: No access token available`);
                continue;
            }

            try {
                const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });
                const data = await response.json();
                if (data.results) {
                    const contacts = data.results.map((contact: any) => ({
                        id: contact.id,
                        name: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim(),
                        email: contact.properties.email,
                        accountEmail: email,
                    }));
                    allContacts.push(...contacts);
                }
            } catch (error) {
                console.error(`HubSpot API error for account ${email}:`, error.message);
                continue;
            }
        }

        return allContacts;
    }

    async bookMeeting(user: any, start: string, end: string, title: string, accountEmail: string): Promise<any> {
        if (!user || !user.googleAccounts || user.googleAccounts.length === 0) {
            throw new UnauthorizedException('No Google accounts connected');
        }

        const account = user.googleAccounts.find(acc => acc.email === accountEmail);
        if (!account || !account.accessToken) {
            throw new UnauthorizedException(`No access token found for account ${accountEmail}`);
        }

        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: account.accessToken });

        const calendar = google.calendar({ version: 'v3', auth });

        try {
            const event = await calendar.events.insert({
                calendarId: 'primary',
                requestBody: {
                    summary: title,
                    start: { dateTime: start },
                    end: { dateTime: end },
                },
            });
            return {
                id: event.data.id,
                title: event.data.summary,
                startTime: event.data.start?.dateTime,
                endTime: event.data.end?.dateTime,
                accountEmail,
            };
        } catch (error) {
            console.error(`Failed to book meeting for account ${accountEmail}:`, {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data ? JSON.stringify(error.response.data, null, 2) : 'No response data',
            });
            throw new BadRequestException('Failed to book meeting: ' + error.message);
        }
    }
}