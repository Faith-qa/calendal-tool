import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { addMinutes, isBefore, isAfter, parseISO, startOfDay } from 'date-fns';
import { CreateSchedulingLinkDto } from '../scheduling/dto/create-scheduling-link.dto';

export interface CalendarSlot {
  id: string;
  start: string;
  end: string;
}

interface BusySlot {
  start: string;
  end: string;
}

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private readonly oauth2Client: OAuth2Client;

  constructor(private readonly configService: ConfigService) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_REDIRECT_URI'),
    );
  }

  private validateTimeParameters(startHour: number, endHour: number, slotDuration: number): void {
    if (startHour < 0 || startHour > 23) {
      throw new BadRequestException('Start hour must be between 0 and 23');
    }
    if (endHour < startHour || endHour > 24) {
      throw new BadRequestException('End hour must be between start hour and 24');
    }
    if (slotDuration < 15 || slotDuration > 120) {
      throw new BadRequestException('Slot duration must be between 15 and 120 minutes');
    }
    if (slotDuration % 5 !== 0) {
      throw new BadRequestException('Slot duration must be a multiple of 5 minutes');
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
    const today = startOfDay(new Date());
    const bookingDay = startOfDay(parsedDate);
    if (isBefore(bookingDay, today)) {
      throw new BadRequestException('Cannot book slots in the past');
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
    timezone: string = 'UTC',
  ): Promise<CalendarSlot[]> {
    try {
      // Validate parameters
      this.validateTimeParameters(startHour, endHour, slotDuration);
      this.validateDate(date);

      this.oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      // Convert local time to UTC for Google Calendar API
      const startTimeLocal = `${date}T${startHour.toString().padStart(2, '0')}:00:00`;
      const endTimeLocal = `${date}T${endHour.toString().padStart(2, '0')}:00:00`;
      
      const startTimeUtc = toZonedTime(startTimeLocal, timezone);
      const endTimeUtc = toZonedTime(endTimeLocal, timezone);

      // Get calendar events for the specified date
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startTimeUtc.toISOString(),
        timeMax: endTimeUtc.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        timeZone: timezone,
      });

      const events = response.data.items || [];
      const busySlots: BusySlot[] = events.map((event) => ({
        start: event.start?.dateTime || event.start?.date || '',
        end: event.end?.dateTime || event.end?.date || '',
      })).filter(slot => slot.start && slot.end);

      // Generate available slots in local timezone
      const slots: CalendarSlot[] = [];
      let currentTime = startTimeUtc;

      while (isBefore(currentTime, endTimeUtc)) {
        const slotEnd = addMinutes(currentTime, slotDuration);
        
        // Skip if slot would exceed end time
        if (isAfter(slotEnd, endTimeUtc)) {
          break;
        }

        const slot = {
          id: `${currentTime.toISOString()}-${slotEnd.toISOString()}`,
          start: formatInTimeZone(currentTime, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX"),
          end: formatInTimeZone(slotEnd, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        };

        // Check if slot overlaps with any busy slots
        const isAvailable = !busySlots.some(
          (busy) => {
            const busyStart = parseISO(busy.start);
            const busyEnd = parseISO(busy.end);
            return (
              (isAfter(currentTime, busyStart) && isBefore(currentTime, busyEnd)) ||
              (isAfter(slotEnd, busyStart) && isBefore(slotEnd, busyEnd)) ||
              (isBefore(currentTime, busyStart) && isAfter(slotEnd, busyEnd))
            );
          }
        );

        if (isAvailable) {
          slots.push(slot);
        }

        currentTime = slotEnd;
      }

      return slots;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new UnauthorizedException('Invalid access token');
      }
      if (error.response?.status === 403) {
        throw new UnauthorizedException('Insufficient permissions to access calendar');
      }
      throw new BadRequestException(`Failed to fetch available slots: ${error.message}`);
    }
  }

  async createEvent(
    accessToken: string,
    startTime: string,
    endTime: string,
    attendeeEmail: string,
    description?: string[],
    timezone: string = 'UTC'
  ) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    this.oauth2Client.setCredentials({ access_token: accessToken });

    const event = {
      summary: 'Scheduled Meeting',
      description: description?.join('\n') || '',
      start: {
        dateTime: startTime,
        timeZone: timezone,
      },
      end: {
        dateTime: endTime,
        timeZone: timezone,
      },
      attendees: [
        {
          email: attendeeEmail,
        },
      ],
    };

    try {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        sendUpdates: 'all',
      });
      return response.data;
    } catch (error) {
      this.logger.error('Error creating calendar event:', error);
      throw error;
    }
  }
} 