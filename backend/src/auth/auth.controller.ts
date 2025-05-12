import { Controller, Get, Req, Res, UseGuards, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { RequestWithUser } from '../types/express';
import { User } from './user.schema';
import { JwtService } from '@nestjs/jwt'; // Add this import

@Controller('auth')
export class AuthController {
  constructor(
      private readonly authService: AuthService,
      private readonly configService: ConfigService,
      private readonly jwtService: JwtService, // Add JwtService
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

  @UseGuards(AuthGuard('jwt'))
  @Get('google/connect')
  @UseGuards(AuthGuard('google'))
  async connectGoogleAccount() {
    // The guard will handle the redirect to Google automatically
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('google/connect/callback')
  @UseGuards(AuthGuard('google'))
  async connectGoogleCallback(@Req() req: RequestWithUser, @Res() res: Response) {
    try {
      if (!req.user || !req.user.accessToken || !req.user.googleEmail) {
        console.error('Connect Google account failed: Invalid user data structure', { user: req.user });
        throw new UnauthorizedException('Invalid user data structure');
      }

      // Ensure _id is a string
      const userId = req.user._id?.toString();
      if (!userId) {
        throw new UnauthorizedException('User ID is missing');
      }

      // Update the user's googleAccounts with the new token and email
      const user = await this.authService.addGoogleAccount(
          userId,
          req.user.googleEmail,
          req.user.accessToken,
      );

      const token = this.jwtService.sign({
        sub: user._id,
        email: user.email,
        name: user.name,
        googleAccounts: user.googleAccounts,
        accessToken: req.user.accessToken,
      });

      return res.redirect(`http://localhost:5001/dashboard?token=${token}`);
    } catch (error) {
      console.error('Google connect callback error:', {
        message: error.message,
        stack: error.stack,
        user: req.user,
      });
      if (error instanceof UnauthorizedException) {
        return res.redirect('http://localhost:5001/dashboard?error=connect_failed');
      }
      throw new InternalServerErrorException('Failed to process Google connect callback');
    }
  }
}