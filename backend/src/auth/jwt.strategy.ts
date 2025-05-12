import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'defaultSecret',
        });
    }

    async validate(payload: any) {
        console.log('JwtStrategy validate payload:', payload);
        const user = await this.authService.findUserById(payload.sub);
        if (!user) {
            console.error('JwtStrategy validate failed: User not found', { userId: payload.sub });
            throw new UnauthorizedException('Invalid user');
        }
        return { ...user.toObject(), accessToken: payload.accessToken };
    }
}