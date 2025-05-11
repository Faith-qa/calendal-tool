import { Test, TestingModule } from '@nestjs/testing';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

describe('CalendarController', () => {
  let controller: CalendarController;
  let service: CalendarService;

  const mockCalendarService = {
    getAvailableSlots: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalendarController],
      providers: [
        {
          provide: CalendarService,
          useValue: mockCalendarService,
        },
      ],
    }).compile();

    controller = module.get<CalendarController>(CalendarController);
    service = module.get<CalendarService>(CalendarService);

    // Mock the current date to a fixed value for testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-05-10T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getAvailableSlots', () => {
    const mockSlots = [
      { start: '2024-05-10T09:00:00.000Z', end: '2024-05-10T09:30:00.000Z' },
      { start: '2024-05-10T09:30:00.000Z', end: '2024-05-10T10:00:00.000Z' },
    ];

    beforeEach(() => {
      mockCalendarService.getAvailableSlots.mockResolvedValue(mockSlots);
    });

    it('should return available slots', async () => {
      const req = {
        user: {
          token: {
            access_token: 'test-token',
          },
        },
      } as unknown as Request;

      const result = await controller.getAvailableSlots(req, { date: '2024-05-10' }, 9, 17, 30);
      expect(result).toEqual(mockSlots);
      expect(mockCalendarService.getAvailableSlots).toHaveBeenCalledWith(
        'test-token',
        '2024-05-10',
        9,
        17,
        30,
      );
    });

    it('should throw UnauthorizedException when access token is missing', async () => {
      const req = {
        user: {},
      } as unknown as Request;

      await expect(controller.getAvailableSlots(req, { date: '2024-05-10' }, 9, 17, 30)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException for invalid date format', async () => {
      const req = {
        user: {
          token: {
            access_token: 'test-token',
          },
        },
      } as unknown as Request;

      await expect(controller.getAvailableSlots(req, { date: 'invalid-date' }, 9, 17, 30)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for past date', async () => {
      const req = {
        user: {
          token: {
            access_token: 'test-token',
          },
        },
      } as unknown as Request;

      await expect(controller.getAvailableSlots(req, { date: '2024-05-09' }, 9, 17, 30)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid time range', async () => {
      const req = {
        user: {
          token: {
            access_token: 'test-token',
          },
        },
      } as unknown as Request;

      await expect(controller.getAvailableSlots(req, { date: '2024-05-10' }, 17, 9, 30)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid slot duration', async () => {
      const req = {
        user: {
          token: {
            access_token: 'test-token',
          },
        },
      } as unknown as Request;

      await expect(controller.getAvailableSlots(req, { date: '2024-05-10' }, 9, 17, 13)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when service fails', async () => {
      const req = {
        user: {
          token: {
            access_token: 'test-token',
          },
        },
      } as unknown as Request;

      mockCalendarService.getAvailableSlots.mockRejectedValue(new Error('Service error'));

      await expect(controller.getAvailableSlots(req, { date: '2024-05-10' }, 9, 17, 30)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
}); 