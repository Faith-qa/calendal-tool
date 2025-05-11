import { Test, TestingModule } from '@nestjs/testing';
import { GoogleStrategy } from './google.strategy';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let authService: AuthService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        GOOGLE_CLIENT_ID: 'test-client-id',
        GOOGLE_CLIENT_SECRET: 'test-client-secret',
        GOOGLE_CALLBACK_URL: 'http://localhost:3000/auth/google/callback',
      };
      return config[key];
    }),
  };

  const mockAuthService = {
    validateOAuthLogin: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
    authService = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const mockUser = {
      _id: '123',
      email: 'test@example.com',
      name: 'Test User',
    };
    const mockToken = 'jwt-token';

    it('should successfully validate a Google profile', async () => {
      const profile = {
        emails: [{ value: 'test@example.com' }],
        displayName: 'Test User',
      };

      mockAuthService.validateOAuthLogin.mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });

      const done = jest.fn();

      await strategy.validate('access-token', 'refresh-token', profile, done);

      expect(mockAuthService.validateOAuthLogin).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
      );
      expect(done).toHaveBeenCalledWith(null, { user: mockUser, token: mockToken });
    });

    it('should throw UnauthorizedException when email is missing', async () => {
      const profile = {
        displayName: 'Test User',
      };

      const done = jest.fn();

      await strategy.validate('access-token', 'refresh-token', profile, done);

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No email found in profile',
        }),
        false,
      );
      expect(mockAuthService.validateOAuthLogin).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when email array is empty', async () => {
      const profile = {
        emails: [],
        displayName: 'Test User',
      };

      const done = jest.fn();

      await strategy.validate('access-token', 'refresh-token', profile, done);

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No email found in profile',
        }),
        false,
      );
      expect(mockAuthService.validateOAuthLogin).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when name is missing', async () => {
      const profile = {
        emails: [{ value: 'test@example.com' }],
      };

      const done = jest.fn();

      await strategy.validate('access-token', 'refresh-token', profile, done);

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No name found in profile',
        }),
        false,
      );
      expect(mockAuthService.validateOAuthLogin).not.toHaveBeenCalled();
    });

    it('should handle auth service errors', async () => {
      const profile = {
        emails: [{ value: 'test@example.com' }],
        displayName: 'Test User',
      };

      const error = new Error('Auth service error');
      mockAuthService.validateOAuthLogin.mockRejectedValue(error);

      const done = jest.fn();

      await strategy.validate('access-token', 'refresh-token', profile, done);

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication failed',
        }),
        false,
      );
    });

    it('should handle empty email value', async () => {
      const profile = {
        emails: [{ value: '' }],
        displayName: 'Test User',
      };

      const done = jest.fn();

      await strategy.validate('access-token', 'refresh-token', profile, done);

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No email found in profile',
        }),
        false,
      );
      expect(mockAuthService.validateOAuthLogin).not.toHaveBeenCalled();
    });
  });
}); 