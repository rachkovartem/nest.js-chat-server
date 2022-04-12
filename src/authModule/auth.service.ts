import { ForbiddenException, Injectable } from '@nestjs/common';
import { UsersService } from '../usersModule/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { jwtConstants } from './constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    let res;
    if (user) {
      res = await bcrypt.compare(pass, user.password);
    }
    if (user && res) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(payload: any) {
    const user = await this.usersService.findOne(payload.email);
    const signPayload = { email: payload.email, id: user.id };
    if (user) {
      return {
        access_token: this.jwtService.sign(
          { ...signPayload },
          { expiresIn: jwtConstants.jwtAccessExpire },
        ),
        refresh_token: this.jwtService.sign(
          { ...signPayload },
          { expiresIn: jwtConstants.jwtRefreshExpire },
        ),
        email: user.email,
        id: user.id,
        username: user.username
      };
    } else {
      return null;
    }
  }

  async refreshAccessToken(payload: any) {
    const signPayload = { email: payload.email, id: payload.id };
    return {
      access_token: this.jwtService.sign(
        { ...signPayload },
        { expiresIn: jwtConstants.jwtAccessExpire },
      ),
    };
  }

  cookieExtractor(req, type) {
    // const getCookie = (type) => {
    //   const match = req.handshake.query.cookies.match(new RegExp('(^| )' + `${type}_token` + '=([^;]+)'));
    //   if (match) return match[2];
    // }
    // let token = null;
    // let decoded;
    // if (req) {
    //   token = 'cookies' in req ? req.cookies[`${type}_token`] : getCookie(type)
    // }
    const token = 'headers' in req ? req.headers.authorization : req.handshake.headers.authorization;
    const decoded = this.jwtService.decode(token);
    if (typeof decoded === "string") return
    return { token, decoded };
  }
}
