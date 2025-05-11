import { Test, TestingModule } from '@nestjs/testing';
import { GoogleStrategy } from './google.strategy';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let authService: AuthService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        {
          provide: AuthService,
          useValue: {
            validateOAuthLogin: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const config = {
                GOOGLE_CLIENT_ID: 'test-client-id',
                GOOGLE_CLIENT_SECRET: 'test-client-secret',
                GOOGLE_CALLBACK_URL: 'http://localhost:3000/auth/google/callback',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
    authService = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate and return user with token', async () => {
    const mockUser = {
      _id: '123',
      email: 'test@example.com',
      name: 'Test User',
    };
    const mockToken = 'test-token';

    jest.spyOn(authService, 'validateOAuthLogin').mockResolvedValue({
      user: mockUser,
      token: mockToken,
    });

    const done = jest.fn();
    const profile = {
      name: {
        givenName: 'Test',
        familyName: 'User',
      },
      emails: [{ value: 'test@example.com' }],
    };

    await strategy.validate('test-access-token', 'test-refresh-token', profile, done);

    expect(authService.validateOAuthLogin).toHaveBeenCalledWith(
      'test@example.com',
      'Test User',
      'test-access-token',
    );
    expect(done).toHaveBeenCalledWith(null, { user: mockUser, token: mockToken });
  });

  it('should handle validation error', async () => {
    const error = new Error('Validation failed');
    jest.spyOn(authService, 'validateOAuthLogin').mockRejectedValue(error);

    const done = jest.fn();
    const profile = {
      name: {
        givenName: 'Test',
        familyName: 'User',
      },
      emails: [{ value: 'test@example.com' }],
    };

    await strategy.validate('test-access-token', 'test-refresh-token', profile, done);

    expect(done).toHaveBeenCalledWith(error, false);
  });
}); 