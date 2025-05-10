import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHello: jest.fn().mockReturnValue('Hello World!'),
            getHealth: jest.fn().mockReturnValue({ status: 'ok' }),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
      expect(appService.getHello).toHaveBeenCalled();
      expect(appService.getHello).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors gracefully', () => {
      jest.spyOn(appService, 'getHello').mockImplementation(() => {
        throw new Error('Service error');
      });

      expect(() => appController.getHello()).toThrow('Service error');
      expect(appService.getHello).toHaveBeenCalled();
    });
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const expectedHealth = { status: 'ok' };
      expect(appController.getHealth()).toEqual(expectedHealth);
      expect(appService.getHealth).toHaveBeenCalled();
      expect(appService.getHealth).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors gracefully', () => {
      jest.spyOn(appService, 'getHealth').mockImplementation(() => {
        throw new Error('Service error');
      });

      expect(() => appController.getHealth()).toThrow('Service error');
      expect(appService.getHealth).toHaveBeenCalled();
    });
  });
});
