import { Test, TestingModule } from '@nestjs/testing';
import { SchedulingService } from './scheduling.service';
import { CalendarService } from '../calendar/calendar.service';
import { BadRequestException, ConflictException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { BookSlotDto } from './dto/book-slot.dto';
import { CreateSchedulingLinkDto } from './dto/create-scheduling-link.dto';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { SchedulingLink } from './schemas/scheduling-link.schema';
import { Booking } from './schemas/booking.schema';
import { AuthService } from '../auth/auth.service';

describe('SchedulingService', () => {
  let service: SchedulingService;
  let calendarService: CalendarService;
  let configService: ConfigService;

  const mockCalendarService = {
    getAvailableSlots: jest.fn(),
    createEvent: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'test@example.com',
        SMTP_PASS: 'test-password',
        SMTP_FROM: 'test@example.com',
      };
      return config[key];
    }),
  };

  const mockSchedulingLinkModel = {
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOne: jest.fn(),
  };

  const mockBookingModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockAuthService = {
    findUserById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulingService,
        {
          provide: CalendarService,
          useValue: mockCalendarService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getModelToken(SchedulingLink.name),
          useValue: mockSchedulingLinkModel,
        },
        {
          provide: getModelToken(Booking.name),
          useValue: mockBookingModel,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = module.get<SchedulingService>(SchedulingService);
    calendarService = module.get<CalendarService>(CalendarService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('bookSlot', () => {
    const mockBookSlotDto: BookSlotDto = {
      slotId: '2024-05-10T09:00:00.000Z-2024-05-10T09:30:00.000Z',
      email: 'test@example.com',
      answers: ['Answer 1', 'Answer 2'],
    };

    const mockAccessToken = 'test-access-token';

    const mockAvailableSlots = [
      {
        start: '2024-05-10T09:00:00.000Z',
        end: '2024-05-10T09:30:00.000Z',
      },
      {
        start: '2024-05-10T09:30:00.000Z',
        end: '2024-05-10T10:00:00.000Z',
      },
    ];

    beforeEach(() => {
      mockCalendarService.getAvailableSlots.mockResolvedValue(mockAvailableSlots);
      mockCalendarService.createEvent.mockResolvedValue({ id: 'event-123' });
      mockBookingModel.create.mockResolvedValue({ _id: 'booking-123' });
    });

    it('should successfully book a slot', async () => {
      const result = await service.bookSlot(mockAccessToken, mockBookSlotDto);
      expect(result).toHaveProperty('bookingId', 'booking-123');
      expect(result).toHaveProperty('eventId', 'event-123');
      expect(result).toHaveProperty('slot');
      expect(result.slot).toEqual({
        start: '2024-05-10T09:00:00.000Z',
        end: '2024-05-10T09:30:00.000Z',
      });
    });

    it('should throw ConflictException when slot is not available', async () => {
      mockCalendarService.getAvailableSlots.mockResolvedValue([]);

      await expect(service.bookSlot(mockAccessToken, mockBookSlotDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw UnauthorizedException when createEvent fails with auth error', async () => {
      mockCalendarService.createEvent.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(service.bookSlot(mockAccessToken, mockBookSlotDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle notification failures gracefully', async () => {
      mockCalendarService.createEvent.mockRejectedValue(new Error('Notification failed'));

      await expect(service.bookSlot(mockAccessToken, mockBookSlotDto)).rejects.toThrow(
        Error,
      );
    });

    it('should throw BadRequestException when slotId format is invalid', async () => {
      const invalidDto = {
        ...mockBookSlotDto,
        slotId: 'invalid-slot-id',
      };

      await expect(service.bookSlot(mockAccessToken, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when email is missing', async () => {
      const invalidDto = {
        ...mockBookSlotDto,
        email: '',
      };

      await expect(service.bookSlot(mockAccessToken, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createSchedulingLink', () => {
    const mockCreateLinkDto = new CreateSchedulingLinkDto();
    Object.assign(mockCreateLinkDto, {
      meetingLength: 30,
      maxDaysInAdvance: 14,
      questions: ['What is your goal?', 'What is your current role?'],
      startHour: 9,
      endHour: 17,
    });

    const mockUserId = 'user-123';

    beforeEach(() => {
      mockSchedulingLinkModel.create.mockResolvedValue({ _id: 'link-123' });
    });

    it('should create a scheduling link with default settings', async () => {
      const result = await service.createSchedulingLink(mockCreateLinkDto, mockUserId);
      expect(result).toEqual({ linkId: 'link-123' });
      expect(mockSchedulingLinkModel.create).toHaveBeenCalled();
    });

    it('should create a scheduling link with custom settings', async () => {
      const customDto = new CreateSchedulingLinkDto();
      Object.assign(customDto, mockCreateLinkDto, {
        maxUses: 5,
        expiresAt: new Date('2024-12-31'),
      });

      const result = await service.createSchedulingLink(customDto, mockUserId);
      expect(result).toEqual({ linkId: 'link-123' });
      expect(mockSchedulingLinkModel.create).toHaveBeenCalled();
    });

    it('should validate meeting length constraints', async () => {
      const invalidDto = new CreateSchedulingLinkDto();
      Object.assign(invalidDto, mockCreateLinkDto, { meetingLength: 10 });
      await expect(service.createSchedulingLink(invalidDto, mockUserId)).rejects.toThrow();
    });

    it('should validate time range constraints', async () => {
      const invalidDto = new CreateSchedulingLinkDto();
      Object.assign(invalidDto, mockCreateLinkDto, { startHour: 17, endHour: 9 });
      await expect(service.createSchedulingLink(invalidDto, mockUserId)).rejects.toThrow();
    });
  });

  describe('getAvailableTimesForLink', () => {
    const mockLinkId = 'link-123';
    const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const mockSlots = [
      { start: `${futureDate}T09:00:00.000Z`, end: `${futureDate}T09:30:00.000Z` }
    ];

    beforeEach(() => {
      mockCalendarService.getAvailableSlots.mockResolvedValue(mockSlots);
    });

    it('should return available times for a valid link', async () => {
      mockSchedulingLinkModel.findById.mockResolvedValue({
        _id: mockLinkId,
        createdBy: 'user-123',
        startHour: 9,
        endHour: 17,
        meetingLength: 30
      });

      const result = await service.getAvailableTimesForLink(mockLinkId, futureDate);
      expect(result).toEqual(mockSlots);
      expect(mockCalendarService.getAvailableSlots).toHaveBeenCalled();
    });

    it('should throw BadRequestException for expired link', async () => {
      mockSchedulingLinkModel.findById.mockResolvedValue({
        _id: mockLinkId,
        createdBy: 'user-123',
        startHour: 9,
        endHour: 17,
        meetingLength: 30,
        expiresAt: new Date('2000-01-01')
      });

      await expect(service.getAvailableTimesForLink(mockLinkId, futureDate))
        .rejects.toThrow('Scheduling link has expired');
    });

    it('should throw BadRequestException when max uses exceeded', async () => {
      mockSchedulingLinkModel.findById.mockResolvedValue({
        _id: mockLinkId,
        createdBy: 'user-123',
        startHour: 9,
        endHour: 17,
        meetingLength: 30,
        maxUses: 5,
        uses: 5
      });

      await expect(service.getAvailableTimesForLink(mockLinkId, futureDate))
        .rejects.toThrow('Scheduling link has reached maximum uses');
    });

    it('should throw BadRequestException for invalid date format', async () => {
      mockSchedulingLinkModel.findById.mockResolvedValue({
        _id: mockLinkId,
        createdBy: 'user-123',
        startHour: 9,
        endHour: 17,
        meetingLength: 30,
        maxUses: 5,
        uses: 0
      });
      await expect(service.getAvailableTimesForLink(mockLinkId, 'invalid-date'))
        .rejects.toThrow('Date must be in YYYY-MM-DD format');
    });
  });

  describe('environment validation', () => {
    it('should throw InternalServerErrorException when required environment variables are missing', async () => {
      // Set NODE_ENV to something other than 'test' to trigger validation
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Mock config service to return undefined for all required variables
      mockConfigService.get.mockImplementation(() => undefined);

      // Create a new instance of the service to trigger validation
      expect(() => new SchedulingService(
        mockCalendarService as any,
        mockSchedulingLinkModel as any,
        mockBookingModel as any,
        mockConfigService as any,
        mockAuthService as any,
      )).toThrow(InternalServerErrorException);

      // Restore NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should not validate environment variables in test environment', async () => {
      // Set NODE_ENV to 'test'
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      // Mock config service to return undefined for all required variables
      mockConfigService.get.mockImplementation(() => undefined);

      // Create a new instance of the service to trigger validation
      const newService = new SchedulingService(
        mockCalendarService as any,
        mockSchedulingLinkModel as any,
        mockBookingModel as any,
        mockConfigService as any,
        mockAuthService as any,
      );

      // Restore NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;

      // The validation should not have thrown
      expect(newService).toBeDefined();
    });
  });
}); 