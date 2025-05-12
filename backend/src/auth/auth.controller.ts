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
      private readonly jwtService: JwtService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: RequestWithUser, @Res() res: Response) {
    if (!req.user || !req.user.accessToken) {
      throw new UnauthorizedException('Invalid user data structure');
    }
    return res.redirect(`http://localhost:5001?token=${req.user.accessToken}`);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('google/connect')
  @UseGuards(AuthGuard('google'))
  async connectGoogleAccount() {}

  @UseGuards(AuthGuard('jwt'))
  @Get('google/connect/callback')
  @UseGuards(AuthGuard('google'))
  async connectGoogleCallback(@Req() req: RequestWithUser, @Res() res: Response) {
    if (!req.user || !req.user.accessToken || !req.user.googleEmail) {
      throw new UnauthorizedException('Invalid user data structure');
    }

    const userId = req.user.id;
    if (!userId) {
      throw new UnauthorizedException('User ID is missing');
    }

    const user = await this.authService.addGoogleAccount(
        userId,
        req.user.googleEmail,
        req.user.accessToken,
        req.user.refreshToken || '',
    );

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      googleAccounts: user.googleAccounts,
      hubspotAccounts: user.hubspotAccounts,
      accessToken: req.user.accessToken,
    });

    return res.redirect(`http://localhost:5001/dashboard?token=${token}`);
  }

  @Get('hubspot')
  @UseGuards(AuthGuard('hubspot'))
  async hubspotAuth() {}

  @Get('hubspot/callback')
  @UseGuards(AuthGuard('hubspot'))
  async hubspotAuthCallback(@Req() req: RequestWithUser, @Res() res: Response) {
    if (!req.user || !req.user.accessToken) {
      throw new UnauthorizedException('Invalid user data structure');
    }
    return res.redirect(`http://localhost:5001?token=${req.user.accessToken}`);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('hubspot/connect')
  @UseGuards(AuthGuard('hubspot'))
  async connectHubSpotAccount() {}

  @UseGuards(AuthGuard('jwt'))
  @Get('hubspot/connect/callback')
  @UseGuards(AuthGuard('hubspot'))
  async connectHubSpotCallback(@Req() req: RequestWithUser, @Res() res: Response) {
    if (!req.user || !req.user.accessToken || !req.user.hubspotEmail) {
      throw new UnauthorizedException('Invalid user data structure');
    }

    const userId = req.user.id;
    const user = await this.authService.addHubSpotAccount(
        userId,
        req.user.hubspotEmail,
        req.user.accessToken,
        req.user.refreshToken || '',
    );

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      googleAccounts: user.googleAccounts,
      hubspotAccounts: user.hubspotAccounts,
      accessToken: req.user.accessToken,
    });

    return res.redirect(`http://localhost:5001/dashboard?token=${token}`);
  }
}