import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './schemas/user.schema';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            validateOAuthLogin: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should handle Google callback', async () => {
    const mockUser = {
      _id: '123',
      email: 'test@example.com',
      name: 'Test User',
    };
    const mockToken = 'test-token';

    const req = {
      user: { user: mockUser, token: mockToken },
    };

    const result = await controller.googleAuthCallback(req);

    expect(result).toEqual({ user: mockUser, token: mockToken });
  });

  it('should handle validation error', async () => {
    const req = {
      user: null,
    };

    await expect(controller.googleAuthCallback(req)).resolves.toEqual({ user: null, token: null });
  });
}); 