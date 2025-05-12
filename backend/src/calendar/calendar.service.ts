import {BadRequestException, Injectable, UnauthorizedException} from '@nestjs/common';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../auth/user.schema';

@Injectable()
export class CalendarService {
  private oauth2Client: OAuth2Client;

  constructor(
      private readonly configService: ConfigService,
      @InjectModel(User.name) private userModel: Model<User>,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
        this.configService.get<string>('GOOGLE_CLIENT_ID'),
        this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
        this.configService.get<string>('GOOGLE_CALLBACK_URL'),
    );
  }

  private async refreshAccessToken(account: any): Promise<string> {
    if (!account.refreshToken) {
      throw new UnauthorizedException('No refresh token available to refresh access token');
    }

    this.oauth2Client.setCredentials({
      refresh_token: account.refreshToken,
    });

    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      const newAccessToken = credentials.access_token;
      if (!newAccessToken) {
        throw new UnauthorizedException('Failed to refresh access token');
      }

      // Update the user's access token in the database
      await this.userModel.updateOne(
          { 'googleAccounts.email': account.email },
          { $set: { 'googleAccounts.$.accessToken': newAccessToken } },
      );

      return newAccessToken;
    } catch (error) {
      console.error('Failed to refresh access token:', error.message);
      throw new UnauthorizedException('Failed to refresh access token');
    }
  }

  async getAvailableSlots(
      user: any,
      date: string,
      startHour: number,
      endHour: number,
      slotDuration: number,
  ): Promise<any[]> {
    if (!user || !user.googleAccounts || user.googleAccounts.length === 0) {
      throw new UnauthorizedException('No Google accounts connected');
    }

    const startDateTime = new Date(date);
    startDateTime.setHours(startHour, 0, 0, 0);
    const endDateTime = new Date(date);
    endDateTime.setHours(endHour, 0, 0, 0);

    let allBusySlots: { start: Date; end: Date }[] = [];

    for (const account of user.googleAccounts) {
      const { email, accessToken, refreshToken } = account;
      if (!accessToken) {
        console.warn(`Skipping account ${email}: No access token available`);
        continue;
      }

      let currentAccessToken = accessToken;
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: currentAccessToken });

      const calendar = google.calendar({ version: 'v3', auth });

      try {
        const response = await calendar.events.list({
          calendarId: 'primary',
          timeMin: startDateTime.toISOString(),
          timeMax: endDateTime.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
        });

        const events = response.data.items || [];
        const busySlots = events.map((event) => ({
          start: new Date(event.start?.dateTime || event.start?.date || 0),
          end: new Date(event.end?.dateTime || event.end?.date || 0),
        }));
        allBusySlots.push(...busySlots);
      } catch (error) {
        if (error.message.includes('Invalid Credentials') && refreshToken) {
          try {
            currentAccessToken = await this.refreshAccessToken(account);
            auth.setCredentials({ access_token: currentAccessToken });

            const retryResponse = await calendar.events.list({
              calendarId: 'primary',
              timeMin: startDateTime.toISOString(),
              timeMax: endDateTime.toISOString(),
              singleEvents: true,
              orderBy: 'startTime',
            });

            const events = retryResponse.data.items || [];
            const busySlots = events.map((event) => ({
              start: new Date(event.start?.dateTime || event.start?.date || 0),
              end: new Date(event.end?.dateTime || event.end?.date || 0),
            }));
            allBusySlots.push(...busySlots);
          } catch (refreshError) {
            console.error(`Failed to refresh token for account ${email}:`, refreshError.message);
            continue;
          }
        } else {
          console.error(`Google Calendar API error for account ${email}:`, {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data ? JSON.stringify(error.response.data, null, 2) : 'No response data',
          });
          continue;
        }
      }
    }

    const availableSlots: { start: string; end: string }[] = [];
    let currentTime = new Date(startDateTime);

    while (currentTime.getTime() < endDateTime.getTime()) {
      const slotEnd = new Date(currentTime.getTime() + slotDuration * 60 * 1000);

      if (slotEnd.getTime() > endDateTime.getTime()) break;

      const isBusy = allBusySlots.some(
          (slot) =>
              currentTime.getTime() < slot.end.getTime() &&
              slotEnd.getTime() > slot.start.getTime(),
      );

      if (!isBusy) {
        availableSlots.push({
          start: currentTime.toISOString(),
          end: slotEnd.toISOString(),
        });
      }

      currentTime = slotEnd;
    }

    return availableSlots;
  }

  async createEvent(
      user: any,
      startTime: string,
      endTime: string,
      email: string,
      answers: string[],
  ): Promise<any> {
    if (!user || !user.googleAccounts || user.googleAccounts.length === 0) {
      throw new UnauthorizedException('No Google accounts connected');
    }

    const account = user.googleAccounts[0];
    const { accessToken, refreshToken } = account;
    if (!accessToken) {
      throw new UnauthorizedException('No access token found for Google account');
    }

    let currentAccessToken = accessToken;
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: currentAccessToken });

    const calendar = google.calendar({ version: 'v3', auth });

    try {
      const event = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: `Meeting with ${email}`,
          description: answers.join('\n'),
          start: { dateTime: startTime },
          end: { dateTime: endTime },
          attendees: [{ email }],
        },
      });
      return {
        id: event.data.id,
        summary: event.data.summary,
        start: event.data.start?.dateTime,
        end: event.data.end?.dateTime,
      };
    } catch (error) {
      if (error.message.includes('Invalid Credentials') && refreshToken) {
        try {
          currentAccessToken = await this.refreshAccessToken(account);
          auth.setCredentials({ access_token: currentAccessToken });

          const event = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
              summary: `Meeting with ${email}`,
              description: answers.join('\n'),
              start: { dateTime: startTime },
              end: { dateTime: endTime },
              attendees: [{ email }],
            },
          });
          return {
            id: event.data.id,
            summary: event.data.summary,
            start: event.data.start?.dateTime,
            end: event.data.end?.dateTime,
          };
        } catch (refreshError) {
          console.error('Failed to refresh token in createEvent:', refreshError.message);
          throw new UnauthorizedException('Failed to create calendar event: Invalid credentials');
        }
      }
      console.error('Failed to create Google Calendar event:', error.message);
      throw new BadRequestException('Failed to create calendar event: ' + error.message);
    }
  }
}