import { Test, TestingModule } from '@nestjs/testing';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';
import { Request } from 'express';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { BookSlotDto } from './dto/book-slot.dto';
import { CreateSchedulingLinkDto } from './dto/create-scheduling-link.dto';
import { ValidationPipe } from '@nestjs/common';

describe('SchedulingController', () => {
  let controller: SchedulingController;
  let service: SchedulingService;

  const mockSchedulingService = {
    bookSlot: jest.fn(),
    createSchedulingLink: jest.fn(),
    getAvailableTimesForLink: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchedulingController],
      providers: [
        {
          provide: SchedulingService,
          useValue: mockSchedulingService,
        },
      ],
    }).compile();

    controller = module.get<SchedulingController>(SchedulingController);
    service = module.get<SchedulingService>(SchedulingService);
  });

  describe('bookSlot', () => {
    const mockRequest = {
      user: { token: { access_token: 'test-access-token' } },
    } as unknown as Request;

    const mockBookSlotDto = {
      slotId: '2024-05-10T09:00:00.000Z-2024-05-10T09:30:00.000Z',
      email: 'test@example.com',
      answers: ['Answer 1', 'Answer 2'],
    };

    it('should successfully book a slot', async () => {
      const mockResult = { success: true };
      service.bookSlot.mockResolvedValue(mockResult);

      const result = await controller.bookSlot(mockBookSlotDto, { user: { id: 'user-123' } });
      expect(result).toEqual(mockResult);
      expect(service.bookSlot).toHaveBeenCalledWith('user-123', mockBookSlotDto);
    });

    it('should throw UnauthorizedException when access token is missing', async () => {
      const requestWithoutToken = {
        user: {},
      } as unknown as Request;

      await expect(controller.bookSlot(mockBookSlotDto, requestWithoutToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException when service fails', async () => {
      mockSchedulingService.bookSlot.mockRejectedValue(new BadRequestException('Invalid slot'));

      await expect(controller.bookSlot(mockBookSlotDto, mockRequest)).rejects.toThrow(
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

    it('should create a scheduling link', async () => {
      const mockResult = {
        id: 'link-123',
        ...mockCreateLinkDto,
        createdAt: new Date(),
      };

      mockSchedulingService.createSchedulingLink.mockResolvedValue(mockResult);

      const result = await controller.createSchedulingLink(mockCreateLinkDto);

      expect(result).toEqual(mockResult);
      expect(service.createSchedulingLink).toHaveBeenCalledWith(mockCreateLinkDto);
    });

    it('should throw BadRequestException for invalid meeting length', async () => {
      const invalidDto: CreateSchedulingLinkDto = {
        ...mockCreateLinkDto,
        meetingLength: 10, // Less than minimum
      };

      mockSchedulingService.createSchedulingLink.mockRejectedValue(
        new BadRequestException('Invalid meeting length'),
      );

      await expect(controller.createSchedulingLink(invalidDto)).rejects.toThrow(BadRequestException);
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

      mockSchedulingService.getAvailableTimesForLink.mockResolvedValue(mockSlots);

      const result = await controller.getAvailableTimesForLink(mockLinkId, mockDate);

      expect(result).toEqual(mockSlots);
      expect(service.getAvailableTimesForLink).toHaveBeenCalledWith(mockLinkId, mockDate);
    });

    it('should throw BadRequestException for expired link', async () => {
      mockSchedulingService.getAvailableTimesForLink.mockRejectedValue(
        new BadRequestException('Link has expired'),
      );

      await expect(controller.getAvailableTimesForLink(mockLinkId, mockDate)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid date format', async () => {
      await expect(controller.getAvailableTimesForLink(mockLinkId, 'invalid-date')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('DTO validation', () => {
    it('should throw BadRequestException for invalid slotId format', async () => {
      const invalidDto = {
        slotId: 'invalid-slot-id',
        email: 'test@example.com',
        answers: ['Answer 1', 'Answer 2'],
      };

      const validationPipe = new ValidationPipe({ transform: true });
      await expect(validationPipe.transform(invalidDto, { type: 'body', metatype: BookSlotDto }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for empty questions array', async () => {
      const invalidDto = {
        questions: [],
        meetingLength: 30,
        maxDaysInAdvance: 14,
      };

      const validationPipe = new ValidationPipe({ transform: true });
      await expect(validationPipe.transform(invalidDto, { type: 'body', metatype: CreateSchedulingLinkDto }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid time range', async () => {
      const invalidDto = {
        questions: ['What is your goal?', 'What is your current role?'],
        meetingLength: 30,
        maxDaysInAdvance: 14,
        startHour: 23,
        endHour: 1,
      };

      const validationPipe = new ValidationPipe({ transform: true });
      await expect(validationPipe.transform(invalidDto, { type: 'body', metatype: CreateSchedulingLinkDto }))
        .rejects.toThrow(BadRequestException);
    });
  });
}); 