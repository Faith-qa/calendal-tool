import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { RequestWithUser } from '../types/express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let googleStrategy: any;

  const mockAuthService = {
    validateOAuthLogin: jest.fn(),
  };

  const mockGoogleStrategy = {
    authenticate: jest.fn(),
  };

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

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    accessToken: 'mock-access-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: 'GoogleStrategy',
          useValue: mockGoogleStrategy,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    googleStrategy = module.get('GoogleStrategy');
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('googleAuth', () => {
    it('should redirect to Google OAuth', async () => {
      const mockReq = {} as Request;
      const mockRes = {
        redirect: jest.fn(),
      } as unknown as Response;

      await controller.googleAuth(mockReq, mockRes);

      expect(mockRes.redirect).toHaveBeenCalledWith('https://accounts.google.com/o/oauth2/auth');
    });

    it('should throw InternalServerErrorException on OAuth error', async () => {
      const mockReq = {} as Request;
      const mockRes = {
        redirect: jest.fn().mockImplementation(() => {
          throw new Error('OAuth error');
        }),
      } as unknown as Response;

      await expect(controller.googleAuth(mockReq, mockRes)).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle missing configuration', async () => {
      mockConfigService.get.mockReturnValueOnce(undefined); // Simulate missing client ID

      const req = {} as Partial<Request>;
      const res = {
        redirect: jest.fn().mockImplementation(() => {
          throw new Error('OAuth error');
        }),
      } as unknown as Response;

      await expect(controller.googleAuth(req as Request, res)).rejects.toThrow(InternalServerErrorException);
      expect(res.redirect).not.toHaveBeenCalled();
    });
  });

  describe('googleAuthCallback', () => {
    it('should handle successful Google OAuth callback', async () => {
      const mockUser = {
        access_token: 'mock-access-token',
      };

      const req = {
        user: mockUser,
      } as unknown as RequestWithUser;

      const result = await controller.googleAuthCallback(req);

      expect(result).toEqual({
        token: 'mock-access-token',
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const req = {
        user: null,
      } as unknown as RequestWithUser;

      await expect(controller.googleAuthCallback(req)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid user data structure', async () => {
      const req = {
        user: {},
      } as unknown as RequestWithUser;

      await expect(controller.googleAuthCallback(req)).rejects.toThrow(UnauthorizedException);
    });
  });
}); 