import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class HubSpotStrategy extends PassportStrategy(Strategy, 'hubspot') {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) {
        super({
            authorizationURL: 'https://app.hubspot.com/oauth/authorize',
            tokenURL: 'https://api.hubapi.com/oauth/v1/token',
            clientID: configService.get<string>('HUBSPOT_CLIENT_ID'),
            clientSecret: configService.get<string>('HUBSPOT_CLIENT_SECRET'),
            callbackURL: configService.get<string>('HUBSPOT_CALLBACK_URL'),
            scope: ['crm.objects.contacts.read'],
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: any, done: Function): Promise<void> {
        try {
            const response = await fetch('https://api.hubapi.com/oauth/v1/access-tokens/' + accessToken);
            const tokenInfo = await response.json();
            const email = tokenInfo.user;

            const { user, token } = await this.authService.validateHubSpotLogin(email, accessToken, refreshToken);
            const validatedUser = {
                ...user.toObject(),
                accessToken: token,
                hubspotEmail: email,
                refreshToken: refreshToken || '',
            };
            done(null, validatedUser);
        } catch (error) {
            done(new UnauthorizedException('Authentication failed'), false);
        }
    }}