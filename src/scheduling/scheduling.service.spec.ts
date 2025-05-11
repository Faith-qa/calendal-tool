import { Test, TestingModule } from '@nestjs/testing';
import { SchedulingService } from './scheduling.service';
import { CalendarService } from '../calendar/calendar.service';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { BookSlotDto } from './dto/book-slot.dto';
import { CreateSchedulingLinkDto } from './dto/create-scheduling-link.dto';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Booking } from './entities/booking.entity';

describe('SchedulingService', () => {
  let service: SchedulingService;
  let calendarService: CalendarService;
  let mockConfigService: ConfigService;
  let mockBookingModel: any;

  const mockCalendarService = {
    getAvailableSlots: jest.fn(),
    createEvent: jest.fn(),
  };

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        const config = {
          'SMTP_HOST': 'smtp.example.com',
          'SMTP_PORT': '587',
          'SMTP_USER': 'test@example.com',
          'SMTP_PASS': 'test-password',
          'SMTP_FROM': 'test@example.com',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulingService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getModelToken(Booking.name),
          useValue: mockBookingModel,
        },
        {
          provide: CalendarService,
          useValue: mockCalendarService,
        },
      ],
    }).compile();

    service = module.get<SchedulingService>(SchedulingService);
    calendarService = module.get<CalendarService>(CalendarService);
  });

  describe('bookSlot', () => {
    const mockBookSlotDto: BookSlotDto = {
      slotId: 'slot-123',
      email: 'test@example.com',
      answers: ['Answer 1', 'Answer 2'],
    };

    const mockAccessToken = 'test-access-token';

    it('should successfully book a slot', async () => {
      const mockSlot = {
        start: '2024-05-10T09:00:00.000Z',
        end: '2024-05-10T09:30:00.000Z',
      };

      mockCalendarService.getAvailableSlots.mockResolvedValue([mockSlot]);
      mockCalendarService.createEvent.mockResolvedValue({ id: 'event-123' });

      const result = await service.bookSlot(mockAccessToken, mockBookSlotDto);

      expect(result).toEqual({
        bookingId: expect.any(String),
        eventId: 'event-123',
        slot: mockSlot,
      });
      expect(mockCalendarService.createEvent).toHaveBeenCalledWith(
        mockAccessToken,
        mockSlot.start,
        mockSlot.end,
        mockBookSlotDto.email,
        mockBookSlotDto.answers,
      );
    });

    it('should throw ConflictException when slot is already booked', async () => {
      mockCalendarService.getAvailableSlots.mockResolvedValue([]);

      await expect(service.bookSlot(mockAccessToken, mockBookSlotDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException when calendar service fails', async () => {
      mockCalendarService.getAvailableSlots.mockRejectedValue(new Error('Calendar service error'));

      await expect(service.bookSlot(mockAccessToken, mockBookSlotDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createSchedulingLink', () => {
    const mockCreateLinkDto: CreateSchedulingLinkDto = {
      meetingLength: 30,
      maxDaysInAdvance: 14,
      questions: ['What is your goal?', 'What is your current role?'],
    };

    it('should create a scheduling link with default settings', async () => {
      const result = await service.createSchedulingLink(mockCreateLinkDto);

      expect(result).toEqual({
        id: expect.any(String),
        ...mockCreateLinkDto,
        createdAt: expect.any(Date),
      });
    });

    it('should create a scheduling link with custom settings', async () => {
      const customDto: CreateSchedulingLinkDto = {
        ...mockCreateLinkDto,
        maxUses: 5,
        expiresAt: new Date('2024-12-31'),
      };

      const result = await service.createSchedulingLink(customDto);

      expect(result).toEqual({
        id: expect.any(String),
        ...customDto,
        createdAt: expect.any(Date),
      });
    });

    it('should validate meeting length constraints', async () => {
      const invalidDto: CreateSchedulingLinkDto = {
        ...mockCreateLinkDto,
        meetingLength: 10, // Less than minimum
      };

      await expect(service.createSchedulingLink(invalidDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAvailableTimesForLink', () => {
    const mockLinkId = 'link-123';
    const mockDate = '2024-05-10';

    it('should return available times for a valid link', async () => {
      const mockSlots = [
        { start: '2024-05-10T09:00:00.000Z', end: '2024-05-10T09:30:00.000Z' },
        { start: '2024-05-10T09:30:00.000Z', end: '2024-05-10T10:00:00.000Z' },
      ];

      mockCalendarService.getAvailableSlots.mockResolvedValue(mockSlots);

      const result = await service.getAvailableTimesForLink(mockLinkId, mockDate);

      expect(result).toEqual(mockSlots);
    });

    it('should throw BadRequestException for expired link', async () => {
      // Mock an expired link
      jest.spyOn(service as any, 'getLink').mockResolvedValue({
        expiresAt: new Date('2024-01-01'),
      });

      await expect(service.getAvailableTimesForLink(mockLinkId, mockDate)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when max uses exceeded', async () => {
      // Mock a link that has exceeded max uses
      jest.spyOn(service as any, 'getLink').mockResolvedValue({
        maxUses: 5,
        uses: 5,
      });

      await expect(service.getAvailableTimesForLink(mockLinkId, mockDate)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
}); 