import { Test, TestingModule } from '@nestjs/testing';
import { GoogleStrategy } from './google.strategy';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let authService: AuthService;

  const mockAuthService = {
    validateOAuthLogin: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'GOOGLE_CLIENT_ID':
          return 'test-client-id';
        case 'GOOGLE_CLIENT_SECRET':
          return 'test-client-secret';
        case 'GOOGLE_CALLBACK_URL':
          return 'http://localhost:3000/auth/google/callback';
        default:
          return undefined;
      }
    });
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
  });

  describe('validate', () => {
    const mockAccessToken = 'test-access-token';
    const mockRefreshToken = 'test-refresh-token';
    const mockProfile = {
      id: '123',
      emails: [{ value: 'test@example.com' }],
      displayName: 'Test User',
    };
    const mockDone = jest.fn();

    it('should return user when validation succeeds', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      mockAuthService.validateOAuthLogin.mockResolvedValue({ user: mockUser, token: mockAccessToken });

      await strategy.validate(mockAccessToken, mockRefreshToken, mockProfile, mockDone);
      expect(mockDone).toHaveBeenCalledWith(null, { token: { access_token: mockAccessToken } });
      expect(mockAuthService.validateOAuthLogin).toHaveBeenCalledWith('test@example.com', 'Test User', mockAccessToken);
    });

    it('should throw UnauthorizedException when email is missing', async () => {
      const profileWithoutEmail = {
        ...mockProfile,
        emails: [],
      };

      await strategy.validate(mockAccessToken, mockRefreshToken, profileWithoutEmail, mockDone);
      expect(mockDone).toHaveBeenCalledWith(new UnauthorizedException('No email found in profile'), false);
    });

    it('should throw UnauthorizedException when name is missing', async () => {
      const profileWithoutName = {
        ...mockProfile,
        displayName: undefined,
      };

      await strategy.validate(mockAccessToken, mockRefreshToken, profileWithoutName, mockDone);
      expect(mockDone).toHaveBeenCalledWith(new UnauthorizedException('No name found in profile'), false);
    });

    it('should throw UnauthorizedException when user validation fails', async () => {
      mockAuthService.validateOAuthLogin.mockRejectedValue(new Error('Validation failed'));

      await strategy.validate(mockAccessToken, mockRefreshToken, mockProfile, mockDone);
      expect(mockDone).toHaveBeenCalledWith(new UnauthorizedException('Authentication failed'), false);
    });
  });
}); 