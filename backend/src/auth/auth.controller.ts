import { Controller, Get, Req, Res, UseGuards, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { RequestWithUser } from '../types/express';
import { User } from './user.schema';

@Controller('auth')
export class AuthController {
  constructor(
      private readonly authService: AuthService,
      private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // The guard will handle the redirect to Google automatically
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: RequestWithUser, @Res() res: Response) {
    try {
      if (!req.user || !req.user.accessToken) {
        console.error('Authentication failed: Invalid user data structure', { user: req.user });
        throw new UnauthorizedException('Invalid user data structure');
      }

      // Redirect to frontend with the token
      return res.redirect(`http://localhost:5001?token=${req.user.accessToken}`);
    } catch (error) {
      console.error('Google callback error:', {
        message: error.message,
        stack: error.stack,
        user: req.user,
      });
      if (error instanceof UnauthorizedException) {
        return res.redirect('http://localhost:5001?error=auth_failed');
      }
      throw new InternalServerErrorException('Failed to process Google callback');
    }
  }
}