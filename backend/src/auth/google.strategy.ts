import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { User } from './user.schema';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
      private readonly authService: AuthService,
      private readonly configService: ConfigService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error('Missing Google OAuth configuration: clientID, clientSecret, or callbackURL');
    }

    console.log('GoogleStrategy configuration:', { clientID, clientSecret, callbackURL });

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile', 'https://www.googleapis.com/auth/calendar.readonly'],
    });
  }

  // Override userProfile to catch token exchange errors
  async userProfile(accessToken: string, done: (err: any, profile?: any) => void): Promise<void> {
    try {
      await super.userProfile(accessToken, done);
    } catch (error) {
      console.error('GoogleStrategy userProfile error:', {
        message: error.message,
        code: error.code,
        status: error.statusCode,
        data: error.data || 'No additional data',
      });
      throw error;
    }
  }

  async validate(
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: VerifyCallback,
  ): Promise<void> {
    try {
      console.log('Google OAuth response:', {
        accessToken,
        refreshToken: refreshToken || 'Not provided',
        profile: JSON.stringify(profile, null, 2),
      });

      if (!profile.emails || profile.emails.length === 0) {
        throw new UnauthorizedException('No email found in profile');
      }

      if (!profile.displayName) {
        throw new UnauthorizedException('No name found in profile');
      }

      const { emails, displayName, id } = profile;
      const email = emails[0].value;
      const name = displayName;
      const googleId = id;

      if (!email) {
        throw new UnauthorizedException('No email found in profile');
      }

      const { user, token } = await this.authService.validateOAuthLogin(email, name, accessToken, googleId);
      const validatedUser: User = {
        ...user.toObject(),
        accessToken: token,
      };
      done(null, validatedUser);
    } catch (error) {
      console.error('Google strategy validation error:', {
        message: error.message,
        stack: error.stack,
        profile: profile ? JSON.stringify(profile, null, 2) : 'No profile',
      });
      if (error instanceof UnauthorizedException) {
        done(error, false);
      } else {
        done(new UnauthorizedException('Authentication failed'), false);
      }
    }
  }
}