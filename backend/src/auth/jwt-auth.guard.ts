import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(err: any, user: any, info: any, context: any) {
        if (err || !user) {
            console.error('JwtAuthGuard error:', {
                err: err ? err.message : null,
                info: info ? info.message : null,
                user,
                headers: context.getRequest().headers,
            });
            throw err || new UnauthorizedException('Invalid or missing JWT token');
        }
        return user;
    }
}