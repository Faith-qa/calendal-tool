import { Test, TestingModule } from '@nestjs/testing';
import { CalendarService } from './calendar.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../auth/schemas/user.schema';
import { Model } from 'mongoose';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

describe('CalendarService', () => {
  let service: CalendarService;
  let userModel: Model<User>;
  let mockOAuth2Client: any;
  let mockCalendar: any;

  const mockUser = {
    _id: '123',
    email: 'test@example.com',
    name: 'Test User',
    accessToken: 'test-access-token',
  };

  const mockEvents = [
    {
      start: { dateTime: '2024-03-20T10:00:00Z' },
      end: { dateTime: '2024-03-20T11:00:00Z' },
    },
    {
      start: { dateTime: '2024-03-20T14:00:00Z' },
      end: { dateTime: '2024-03-20T15:00:00Z' },
    },
  ];

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1); // Set to tomorrow
  const dateStr = futureDate.toISOString().split('T')[0];

  beforeEach(async () => {
    mockOAuth2Client = {
      setCredentials: jest.fn(),
    };

    mockCalendar = {
      events: {
        list: jest.fn(),
        insert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: 'GOOGLE_AUTH_CLIENT',
          useValue: mockOAuth2Client,
        },
        {
          provide: 'GOOGLE_CALENDAR',
          useValue: mockCalendar,
        },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
    userModel = module.get<Model<User>>(getModelToken(User.name));

    // Mock the fetchCalendarEvents method
    jest.spyOn(service as any, 'fetchCalendarEvents').mockImplementation(async () => mockEvents);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAvailableSlots', () => {
    it('should calculate available time slots', async () => {
      const mockEvents = {
        data: {
          items: [
            {
              start: { dateTime: `${dateStr}T10:00:00Z` },
              end: { dateTime: `${dateStr}T11:00:00Z` },
            },
          ],
        },
      };

      mockCalendar.events.list.mockResolvedValue(mockEvents);

      const result = await service.getAvailableSlots('test-token', dateStr);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('startTime');
      expect(result[0]).toHaveProperty('endTime');
      expect(result[0]).toHaveProperty('duration');
    });

    it('should handle empty events list', async () => {
      const mockEvents = {
        data: {
          items: [],
        },
      };

      mockCalendar.events.list.mockResolvedValue(mockEvents);

      const result = await service.getAvailableSlots('test-token', dateStr);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should use custom timezone when provided', async () => {
      const mockEvents = {
        data: {
          items: [],
        },
      };

      mockCalendar.events.list.mockResolvedValue(mockEvents);

      const result = await service.getAvailableSlots('test-token', dateStr, 'America/New_York');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValue(null);

      await expect(service.getAvailableSlots('123', '2024-03-20')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if date is in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const dateStr = pastDate.toISOString().split('T')[0];

      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser as any);

      await expect(service.getAvailableSlots('123', dateStr)).rejects.toThrow(BadRequestException);
    });
  });
}); 