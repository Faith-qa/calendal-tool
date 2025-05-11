import { Controller, Get, Req, Res, UseGuards, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: Request, @Res() res: Response) {
    // The guard will handle the redirect to Google
    return res.redirect('https://accounts.google.com/o/oauth2/auth');
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('Authentication failed: No user data received from Google');
      }

      const { user, token } = req.user as { user: any; token: string };
      
      if (!user || !token) {
        throw new UnauthorizedException('Authentication failed: Invalid user data structure');
      }

      return {
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name
          },
          token
        }
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('An error occurred during authentication');
    }
  }
} 