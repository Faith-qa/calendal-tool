import { Test, TestingModule } from '@nestjs/testing';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';
import { Request } from 'express';
import { BadRequestException, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { BookSlotDto } from './dto/book-slot.dto';
import { CreateSchedulingLinkDto } from './dto/create-scheduling-link.dto';
import { RequestWithUser } from '../types/express';

describe('SchedulingController', () => {
  let controller: SchedulingController;
  let service: SchedulingService;
  let validationPipe: ValidationPipe;

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
    validationPipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      validateCustomDecorators: true,
      exceptionFactory: (errors) => {
        const messages = errors
          .map(err => Object.values(err.constraints || {}).join(', '))
          .join('; ');
        return new BadRequestException(messages);
      },
    });
  });

  describe('bookSlot', () => {
    const mockRequest = {
      user: { id: 'user-123' },
      get: jest.fn(),
      header: jest.fn(),
      accepts: jest.fn(),
      acceptsCharsets: jest.fn(),
    } as unknown as RequestWithUser;

    const mockBookSlotDto = {
      slotId: '2024-05-10T09:00:00.000Z-2024-05-10T09:30:00.000Z',
      email: 'test@example.com',
      answers: ['Answer 1', 'Answer 2'],
    };

    it('should successfully book a slot', async () => {
      const mockResult = { success: true };
      mockSchedulingService.bookSlot.mockResolvedValue(mockResult);

      const result = await controller.bookSlot(mockBookSlotDto, mockRequest);
      expect(result).toEqual(mockResult);
      expect(mockSchedulingService.bookSlot).toHaveBeenCalledWith('user-123', mockBookSlotDto);
    });

    it('should throw UnauthorizedException when user ID is missing', async () => {
      const requestWithoutUser = {
        user: {},
        get: jest.fn(),
        header: jest.fn(),
        accepts: jest.fn(),
        acceptsCharsets: jest.fn(),
      } as unknown as RequestWithUser;

      await expect(controller.bookSlot(mockBookSlotDto, requestWithoutUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException when service fails', async () => {
      mockSchedulingService.bookSlot.mockRejectedValue(new BadRequestException('Invalid slot'));

      await expect(controller.bookSlot(mockBookSlotDto, mockRequest)).rejects.toThrow(
        BadRequestException,
      );
    });

    describe('DTO validation', () => {
      it('should throw BadRequestException for invalid email format', async () => {
        const invalidDto = {
          ...mockBookSlotDto,
          email: 'invalid-email',
        };

        await expect(validationPipe.transform(invalidDto, { type: 'body', metatype: BookSlotDto }))
          .rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException for missing required fields', async () => {
        const invalidDto = {
          slotId: mockBookSlotDto.slotId,
          // email is missing
        };

        await expect(validationPipe.transform(invalidDto, { type: 'body', metatype: BookSlotDto }))
          .rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException for invalid slotId format', async () => {
        const invalidDto = {
          ...mockBookSlotDto,
          slotId: 'invalid-slot-id',
        };

        await expect(validationPipe.transform(invalidDto, { type: 'body', metatype: BookSlotDto }))
          .rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException for invalid date format', async () => {
        const invalidDto = {
          ...mockBookSlotDto,
          date: '2024/05/10', // Invalid format
        };

        await expect(validationPipe.transform(invalidDto, { type: 'body', metatype: BookSlotDto }))
          .rejects.toThrow(BadRequestException);
      });

      it('should accept valid date format', async () => {
        const validDto = {
          ...mockBookSlotDto,
          date: '2024-05-10',
        };

        const result = await validationPipe.transform(validDto, { type: 'body', metatype: BookSlotDto });
        expect(result.date).toBe('2024-05-10');
      });

      it('should throw BadRequestException for non-whitelisted properties', async () => {
        const invalidDto = {
          ...mockBookSlotDto,
          extraField: 'not-allowed',
        };

        await expect(validationPipe.transform(invalidDto, { type: 'body', metatype: BookSlotDto }))
          .rejects.toThrow(BadRequestException);
      });
    });
  });

  describe('createSchedulingLink', () => {
    const mockRequest = {
      user: { id: 'user-123' },
      get: jest.fn(),
      header: jest.fn(),
      accepts: jest.fn(),
      acceptsCharsets: jest.fn(),
    } as unknown as RequestWithUser;

    const validCreateLinkDtoObj = {
      questions: ['What is your goal?', 'What is your current role?'],
      meetingLength: 30,
      maxDaysInAdvance: 14,
      startHour: 9,
      endHour: 17,
    };

    it('should successfully create a scheduling link', async () => {
      const mockResult = { linkId: 'test-link-id' };
      mockSchedulingService.createSchedulingLink.mockResolvedValue(mockResult);

      const result = await controller.createSchedulingLink(validCreateLinkDtoObj as any, mockRequest);
      expect(result).toEqual(mockResult);
      expect(mockSchedulingService.createSchedulingLink).toHaveBeenCalledWith(validCreateLinkDtoObj as any, 'user-123');
    });

    describe('DTO validation', () => {
      it('should accept valid DTO', async () => {
        const dto = new CreateSchedulingLinkDto();
        Object.assign(dto, validCreateLinkDtoObj);
        const result = await validationPipe.transform(dto, { type: 'body', metatype: CreateSchedulingLinkDto });
        expect(result).toEqual(dto);
      });

      it('should throw BadRequestException for invalid time range', async () => {
        const dto = new CreateSchedulingLinkDto();
        Object.assign(dto, validCreateLinkDtoObj, { startHour: 17, endHour: 9 });
        await expect(validationPipe.transform(dto, { type: 'body', metatype: CreateSchedulingLinkDto }))
          .rejects.toThrow(BadRequestException);
      });

      it('should throw for invalid time range using custom validator', async () => {
        const dto = new CreateSchedulingLinkDto();
        Object.assign(dto, validCreateLinkDtoObj, { startHour: 17, endHour: 9 });
        await expect(validationPipe.transform(dto, { type: 'body', metatype: CreateSchedulingLinkDto }))
          .rejects.toThrow('endHour must be greater than startHour');
      });

      it('should throw BadRequestException for invalid startHour', async () => {
        const dto = new CreateSchedulingLinkDto();
        Object.assign(dto, validCreateLinkDtoObj, { startHour: -1 });
        await expect(validationPipe.transform(dto, { type: 'body', metatype: CreateSchedulingLinkDto }))
          .rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException for invalid endHour', async () => {
        const dto = new CreateSchedulingLinkDto();
        Object.assign(dto, validCreateLinkDtoObj, { endHour: 25 });
        await expect(validationPipe.transform(dto, { type: 'body', metatype: CreateSchedulingLinkDto }))
          .rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException for invalid meeting length', async () => {
        const dto = new CreateSchedulingLinkDto();
        Object.assign(dto, validCreateLinkDtoObj, { meetingLength: 10 });
        await expect(validationPipe.transform(dto, { type: 'body', metatype: CreateSchedulingLinkDto }))
          .rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException for invalid maxDaysInAdvance', async () => {
        const dto = new CreateSchedulingLinkDto();
        Object.assign(dto, validCreateLinkDtoObj, { maxDaysInAdvance: 0 });
        await expect(validationPipe.transform(dto, { type: 'body', metatype: CreateSchedulingLinkDto }))
          .rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException for invalid questions', async () => {
        const dto = new CreateSchedulingLinkDto();
        Object.assign(dto, validCreateLinkDtoObj, { questions: [123] });
        await expect(validationPipe.transform(dto, { type: 'body', metatype: CreateSchedulingLinkDto }))
          .rejects.toThrow(BadRequestException);
      });

      it('should accept valid optional fields', async () => {
        const dto = new CreateSchedulingLinkDto();
        Object.assign(dto, validCreateLinkDtoObj, { maxUses: 5, expiresAt: new Date('2024-12-31') });
        const result = await validationPipe.transform(dto, { type: 'body', metatype: CreateSchedulingLinkDto });
        expect(result).toEqual(dto);
      });
    });
  });

  describe('getAvailableTimesForLink', () => {
    const mockRequest = {
      user: { id: 'user-123' },
      get: jest.fn(),
      header: jest.fn(),
      accepts: jest.fn(),
      acceptsCharsets: jest.fn(),
    } as unknown as RequestWithUser;

    it('should successfully get available times for a link', async () => {
      const mockResult = [
        { start: '2024-05-10T09:00:00.000Z', end: '2024-05-10T09:30:00.000Z' },
        { start: '2024-05-10T09:30:00.000Z', end: '2024-05-10T10:00:00.000Z' },
      ];
      mockSchedulingService.getAvailableTimesForLink.mockResolvedValue(mockResult);

      const result = await controller.getAvailableTimesForLink('test-link-id', '2024-05-10', mockRequest);
      expect(result).toEqual(mockResult);
      expect(mockSchedulingService.getAvailableTimesForLink).toHaveBeenCalledWith('test-link-id', '2024-05-10');
    });

    it('should throw BadRequestException when service fails', async () => {
      mockSchedulingService.getAvailableTimesForLink.mockRejectedValue(new BadRequestException('Invalid link'));

      await expect(controller.getAvailableTimesForLink('test-link-id', '2024-05-10', mockRequest)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid date format', async () => {
      await expect(controller.getAvailableTimesForLink('test-link-id', '2024/05/10', mockRequest)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
}); 