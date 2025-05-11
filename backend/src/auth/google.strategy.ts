import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || '',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      if (!profile.emails || profile.emails.length === 0) {
        throw new UnauthorizedException('No email found in profile');
        return;
      }

      if (!profile.displayName) {
        throw new UnauthorizedException('No name found in profile');
        return;
      }

      const { emails, displayName } = profile;
      const email = emails[0].value;
      const name = displayName;

      if (!email) {
        throw new UnauthorizedException('No email found in profile');
        return;
      }

      const { user, token } = await this.authService.validateOAuthLogin(email, name, accessToken);
      done(null, { token: { access_token: token } });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        done(error, false);
      } else {
        done(new UnauthorizedException('Authentication failed'), false);
      }
    }
  }
} 