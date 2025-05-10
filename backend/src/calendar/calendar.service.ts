import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

@Injectable()
export class CalendarService {
  constructor(private readonly configService: ConfigService) {}

  private validateTimeParameters(startHour: number, endHour: number, slotDuration: number): void {
    if (startHour < 0 || startHour > 23) {
      throw new BadRequestException('Start hour must be between 0 and 23');
    }
    if (endHour < startHour || endHour > 24) {
      throw new BadRequestException('End hour must be between start hour and 24');
    }
    if (slotDuration <= 0 || slotDuration > 120) {
      throw new BadRequestException('Slot duration must be between 1 and 120 minutes');
    }
  }

  private validateDate(date: string): void {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new BadRequestException('Date must be in YYYY-MM-DD format');
    }
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Invalid date');
    }
  }

  private createGoogleAuthClient(accessToken: string) {
    try {
      const auth = new google.auth.OAuth2(
        this.configService.get<string>('GOOGLE_CLIENT_ID'),
        this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      );
      auth.setCredentials({ access_token: accessToken });
      return auth;
    } catch (error) {
      throw new UnauthorizedException('Failed to initialize Google auth client');
    }
  }

  async getEvents(
    accessToken: string,
    startTime: string,
    endTime: string,
    timeZone: string = 'UTC',
  ): Promise<any[]> {
    try {
      const auth = this.createGoogleAuthClient(accessToken);
      const calendar = google.calendar({ version: 'v3', auth });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startTime,
        timeMax: endTime,
        singleEvents: true,
        orderBy: 'startTime',
        timeZone,
      });

      return response.data.items || [];
    } catch (error) {
      if (error.response?.status === 401) {
        throw new UnauthorizedException('Invalid or expired access token');
      }
      if (error.response?.status === 403) {
        throw new UnauthorizedException('Insufficient permissions to access calendar');
      }
      throw new BadRequestException(`Failed to fetch events: ${error.message}`);
    }
  }

  async getAvailableSlots(
    accessToken: string,
    date: string,
    startHour: number,
    endHour: number,
    slotDuration: number,
    timeZone: string = 'UTC',
  ): Promise<Array<{ start: string; end: string }>> {
    try {
      this.validateDate(date);
      this.validateTimeParameters(startHour, endHour, slotDuration);

      const startTime = new Date(`${date}T00:00:00.000Z`);
      const endTime = new Date(`${date}T23:59:59.999Z`);

      const events = await this.getEvents(
        accessToken,
        startTime.toISOString(),
        endTime.toISOString(),
        timeZone,
      );

      const slots: Array<{ start: string; end: string }> = [];
      let currentTime = new Date(`${date}T${startHour.toString().padStart(2, '0')}:00:00.000Z`);

      while (currentTime.getUTCHours() < endHour) {
        const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);
        const isSlotAvailable = !events.some((event) => {
          const eventStart = new Date(event.start.dateTime || event.start.date);
          const eventEnd = new Date(event.end.dateTime || event.end.date);
          return (
            (currentTime >= eventStart && currentTime < eventEnd) ||
            (slotEnd > eventStart && slotEnd <= eventEnd) ||
            (currentTime <= eventStart && slotEnd >= eventEnd)
          );
        });

        if (isSlotAvailable) {
          slots.push({
            start: currentTime.toISOString(),
            end: slotEnd.toISOString(),
          });
        }

        currentTime = slotEnd;
      }

      return slots;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException(`Failed to calculate available slots: ${error.message}`);
    }
  }
} 