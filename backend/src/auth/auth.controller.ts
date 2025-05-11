import { Controller, Get, Req, Res, UseGuards, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { RequestWithUser } from '../types/express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: Request, @Res() res: Response) {
    try {
      // Check for required Google config
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
      const callbackUrl = this.configService.get<string>('GOOGLE_CALLBACK_URL');
      if (!clientId || !clientSecret || !callbackUrl) {
        throw new InternalServerErrorException('Missing Google OAuth configuration');
      }
      // The guard will handle the redirect to Google
      return res.redirect('https://accounts.google.com/o/oauth2/auth');
    } catch (error) {
      throw new InternalServerErrorException('OAuth error');
    }
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: RequestWithUser) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const user = req.user as unknown as { access_token: string };
    if (!user.access_token) {
      throw new UnauthorizedException('Invalid user data structure');
    }

    return {
      token: user.access_token,
    };
  }
} 