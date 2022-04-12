import {ExtractJwt, Strategy} from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';
import { AuthService } from './auth.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwtRefresh',
) {
  constructor(private readonly authService: AuthService) {
    super({
      // jwtFromRequest: ExtractJwt.fromHeader('Authorization'),
      jwtFromRequest: (req) =>
        authService.cookieExtractor(req, 'refresh').token,
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }
  async validate(payload: any) {
    return { id: payload.id, email: payload.email };
  }
}
