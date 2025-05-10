import { Test, TestingModule } from '@nestjs/testing';
import { CalendarService } from './calendar.service';
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

jest.mock('googleapis');

describe('CalendarService', () => {
  let service: CalendarService;
  let mockCalendar;

  const mockEvents = [
    {
      start: { dateTime: '2024-05-10T10:00:00Z' },
      end: { dateTime: '2024-05-10T11:00:00Z' },
    },
    {
      start: { dateTime: '2024-05-10T14:00:00Z' },
      end: { dateTime: '2024-05-10T15:00:00Z' },
    },
  ];

  beforeEach(async () => {
    mockCalendar = {
      events: {
        list: jest.fn().mockResolvedValue({ data: { items: mockEvents } }),
      },
    };

    (google.calendar as jest.Mock).mockReturnValue(mockCalendar);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                GOOGLE_CLIENT_ID: 'test-client-id',
                GOOGLE_CLIENT_SECRET: 'test-client-secret',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEvents', () => {
    it('should fetch events from Google Calendar', async () => {
      const accessToken = 'test-access-token';
      const startTime = '2024-05-10T00:00:00Z';
      const endTime = '2024-05-10T23:59:59Z';

      const result = await service.getEvents(accessToken, startTime, endTime);

      expect(mockCalendar.events.list).toHaveBeenCalledWith({
        calendarId: 'primary',
        timeMin: startTime,
        timeMax: endTime,
        singleEvents: true,
        orderBy: 'startTime',
        timeZone: 'UTC',
      });
      expect(result).toEqual(mockEvents);
    });

    it('should handle empty events list', async () => {
      mockCalendar.events.list.mockResolvedValueOnce({ data: { items: [] } });
      const result = await service.getEvents('test-token', '2024-05-10T00:00:00Z', '2024-05-10T23:59:59Z');
      expect(result).toEqual([]);
    });

    it('should throw UnauthorizedException for invalid access token', async () => {
      mockCalendar.events.list.mockRejectedValueOnce({ response: { status: 401 } });
      await expect(
        service.getEvents('invalid-token', '2024-05-10T00:00:00Z', '2024-05-10T23:59:59Z'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for insufficient permissions', async () => {
      mockCalendar.events.list.mockRejectedValueOnce({ response: { status: 403 } });
      await expect(
        service.getEvents('test-token', '2024-05-10T00:00:00Z', '2024-05-10T23:59:59Z'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException for API errors', async () => {
      mockCalendar.events.list.mockRejectedValueOnce(new Error('API error'));
      await expect(
        service.getEvents('test-token', '2024-05-10T00:00:00Z', '2024-05-10T23:59:59Z'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use custom timezone when provided', async () => {
      const timeZone = 'America/New_York';
      await service.getEvents('test-token', '2024-05-10T00:00:00Z', '2024-05-10T23:59:59Z', timeZone);
      expect(mockCalendar.events.list).toHaveBeenCalledWith(expect.objectContaining({ timeZone }));
    });
  });

  describe('getAvailableSlots', () => {
    it('should calculate available time slots', async () => {
      const result = await service.getAvailableSlots(
        'test-token',
        '2024-05-10',
        9,
        17,
        30,
      );

      expect(result).toEqual([
        { start: '2024-05-10T09:00:00.000Z', end: '2024-05-10T09:30:00.000Z' },
        { start: '2024-05-10T09:30:00.000Z', end: '2024-05-10T10:00:00.000Z' },
        { start: '2024-05-10T11:00:00.000Z', end: '2024-05-10T11:30:00.000Z' },
        { start: '2024-05-10T11:30:00.000Z', end: '2024-05-10T12:00:00.000Z' },
        { start: '2024-05-10T12:00:00.000Z', end: '2024-05-10T12:30:00.000Z' },
        { start: '2024-05-10T12:30:00.000Z', end: '2024-05-10T13:00:00.000Z' },
        { start: '2024-05-10T13:00:00.000Z', end: '2024-05-10T13:30:00.000Z' },
        { start: '2024-05-10T13:30:00.000Z', end: '2024-05-10T14:00:00.000Z' },
        { start: '2024-05-10T15:00:00.000Z', end: '2024-05-10T15:30:00.000Z' },
        { start: '2024-05-10T15:30:00.000Z', end: '2024-05-10T16:00:00.000Z' },
        { start: '2024-05-10T16:00:00.000Z', end: '2024-05-10T16:30:00.000Z' },
        { start: '2024-05-10T16:30:00.000Z', end: '2024-05-10T17:00:00.000Z' },
      ]);
    });

    describe('date validation', () => {
      it('should throw BadRequestException for invalid date format', async () => {
        await expect(
          service.getAvailableSlots('test-token', '05/10/2024', 9, 10, 30),
        ).rejects.toThrow('Date must be in YYYY-MM-DD format');
      });

      it('should throw BadRequestException for invalid date', async () => {
        await expect(
          service.getAvailableSlots('test-token', '2024-13-45', 9, 10, 30),
        ).rejects.toThrow('Invalid date');
      });
    });

    it('should handle empty events list', async () => {
      mockCalendar.events.list.mockResolvedValueOnce({ data: { items: [] } });
      const result = await service.getAvailableSlots('test-token', '2024-05-10', 9, 10, 30);
      expect(result).toEqual([
        { start: '2024-05-10T09:00:00.000Z', end: '2024-05-10T09:30:00.000Z' },
        { start: '2024-05-10T09:30:00.000Z', end: '2024-05-10T10:00:00.000Z' },
      ]);
    });

    describe('input validation', () => {
      it('should throw BadRequestException for invalid start hour', async () => {
        await expect(
          service.getAvailableSlots('test-token', '2024-05-10', -1, 10, 30),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException for invalid end hour', async () => {
        await expect(
          service.getAvailableSlots('test-token', '2024-05-10', 9, 25, 30),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException for end hour before start hour', async () => {
        await expect(
          service.getAvailableSlots('test-token', '2024-05-10', 10, 9, 30),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException for invalid slot duration', async () => {
        await expect(
          service.getAvailableSlots('test-token', '2024-05-10', 9, 10, 0),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException for slot duration exceeding 120 minutes', async () => {
        await expect(
          service.getAvailableSlots('test-token', '2024-05-10', 9, 10, 121),
        ).rejects.toThrow(BadRequestException);
      });
    });

    it('should handle API errors gracefully', async () => {
      mockCalendar.events.list.mockRejectedValueOnce(new Error('API error'));
      await expect(
        service.getAvailableSlots('test-token', '2024-05-10', 9, 10, 30),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use custom timezone when provided', async () => {
      const timeZone = 'America/New_York';
      await service.getAvailableSlots('test-token', '2024-05-10', 9, 17, 30, timeZone);
      expect(mockCalendar.events.list).toHaveBeenCalledWith(expect.objectContaining({ timeZone }));
    });
  });
}); 