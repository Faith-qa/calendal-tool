import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';

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
    it('should initiate Google OAuth flow', async () => {
      const req = {} as Partial<Request>;
      const res = {
        redirect: jest.fn(),
      } as unknown as Response;

      await controller.googleAuth(req as Request, res);

      expect(res.redirect).toHaveBeenCalledWith('https://accounts.google.com/o/oauth2/auth');
    });

    it('should handle Google OAuth flow errors', async () => {
      const req = {} as Partial<Request>;
      const res = {
        redirect: jest.fn(() => { throw new Error('OAuth error'); }),
      } as unknown as Response;

      await expect(controller.googleAuth(req as Request, res)).rejects.toThrow('OAuth error');
      expect(res.redirect).toHaveBeenCalled();
    });
  });

  describe('googleAuthRedirect', () => {
    it('should handle successful Google OAuth callback', async () => {
      const req = {
        user: {
          user: { _id: '123', email: 'test@example.com', name: 'Test User' },
          token: 'jwt-token',
        },
      } as Partial<Request>;

      const result = await controller.googleAuthRedirect(req as Request);

      expect(result).toEqual({
        success: true,
        data: {
          user: { id: '123', email: 'test@example.com', name: 'Test User' },
          token: 'jwt-token',
        },
      });
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      const req = {} as Partial<Request>;

      await expect(controller.googleAuthRedirect(req as Request)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid user data structure', async () => {
      // Simulate an error by passing a request with user but missing token
      const req = {
        user: {
          user: { _id: '123', email: 'test@example.com', name: 'Test User' },
          // token is missing
        },
      } as Partial<Request>;

      await expect(controller.googleAuthRedirect(req as Request))
        .rejects
        .toThrow(UnauthorizedException);
    });
  });
}); 