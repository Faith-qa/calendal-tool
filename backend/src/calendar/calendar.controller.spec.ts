import { Test, TestingModule } from '@nestjs/testing';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { Request } from 'express';
import { BadRequestException, UnauthorizedException, ValidationPipe } from '@nestjs/common';

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
    })
      .overrideProvider(ValidationPipe)
      .useValue(new ValidationPipe({ transform: true, whitelist: true }))
      .compile();

    controller = module.get<CalendarController>(CalendarController);
    service = module.get<CalendarService>(CalendarService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAvailableSlots', () => {
    const mockRequest = {
      user: { token: { access_token: 'test-access-token' } },
    } as unknown as Request;

    const mockSlots = [
      { start: '2024-05-10T09:00:00.000Z', end: '2024-05-10T09:30:00.000Z' },
      { start: '2024-05-10T09:30:00.000Z', end: '2024-05-10T10:00:00.000Z' },
    ];

    it('should return available slots', async () => {
      mockCalendarService.getAvailableSlots.mockResolvedValue(mockSlots);

      const result = await controller.getAvailableSlots(
        mockRequest,
        { date: '2024-05-10' },
        9,
        10,
        30,
      );

      expect(service.getAvailableSlots).toHaveBeenCalledWith(
        'test-access-token',
        '2024-05-10',
        9,
        10,
        30,
        undefined,
      );
      expect(result).toEqual(mockSlots);
    });

    it('should handle custom timezone', async () => {
      mockCalendarService.getAvailableSlots.mockResolvedValue(mockSlots);

      await controller.getAvailableSlots(
        mockRequest,
        { date: '2024-05-10' },
        9,
        10,
        30,
        'America/New_York',
      );

      expect(service.getAvailableSlots).toHaveBeenCalledWith(
        'test-access-token',
        '2024-05-10',
        9,
        10,
        30,
        'America/New_York',
      );
    });

    describe('access token validation', () => {
      it('should throw UnauthorizedException when access token is missing', async () => {
        const requestWithoutToken = {
          user: {},
        } as unknown as Request;

        await expect(
          controller.getAvailableSlots(requestWithoutToken, { date: '2024-05-10' }, 9, 10, 30),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should throw UnauthorizedException when token object is malformed', async () => {
        const requestWithMalformedToken = {
          user: { token: 'invalid-token' },
        } as unknown as Request;

        await expect(
          controller.getAvailableSlots(requestWithMalformedToken, { date: '2024-05-10' }, 9, 10, 30),
        ).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('date validation', () => {
      it('should throw BadRequestException for invalid date format', async () => {
        await expect(
          controller.getAvailableSlots(mockRequest, { date: 'invalid-date' }, 9, 10, 30),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException for non-ISO date format', async () => {
        await expect(
          controller.getAvailableSlots(mockRequest, { date: '05/10/2024' }, 9, 10, 30),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('service error handling', () => {
      it('should propagate BadRequestException from service', async () => {
        mockCalendarService.getAvailableSlots.mockRejectedValue(
          new BadRequestException('Invalid time parameters'),
        );

        await expect(
          controller.getAvailableSlots(mockRequest, { date: '2024-05-10' }, 9, 10, 30),
        ).rejects.toThrow(BadRequestException);
      });

      it('should propagate UnauthorizedException from service', async () => {
        mockCalendarService.getAvailableSlots.mockRejectedValue(
          new UnauthorizedException('Invalid access token'),
        );

        await expect(
          controller.getAvailableSlots(mockRequest, { date: '2024-05-10' }, 9, 10, 30),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should wrap other errors in BadRequestException', async () => {
        mockCalendarService.getAvailableSlots.mockRejectedValue(new Error('Service error'));

        await expect(
          controller.getAvailableSlots(mockRequest, { date: '2024-05-10' }, 9, 10, 30),
        ).rejects.toThrow(BadRequestException);
        expect(mockCalendarService.getAvailableSlots).toHaveBeenCalled();
      });
    });
  });
}); 