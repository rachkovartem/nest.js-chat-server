import {Controller, Get, Post, Req, Request, Res, UseGuards,} from '@nestjs/common';
import {UsersService} from 'src/usersModule/users.service';
import {AuthService} from './auth.service';
import {JwtRefreshAuthGuard} from './guards/jwt-refresh-auth.guard';
import {LocalAuthGuard} from './guards/local-auth.guard';
import {JwtAuthGuard} from "./guards/jwt-auth.guard";
import {jwtConstants} from "./constants";

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  @Post('auth/register')
  async register(@Request() req) {
    return this.userService.createUser(req.body);
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Res({ passthrough: true }) res, @Req() req) {
    const { access_token, refresh_token, id, email, username } =
      await this.authService.login(req.body);
    res.cookie('access_token', access_token, {
      maxAge: jwtConstants.accessExpire
    });
    res.cookie('refresh_token', refresh_token, {
      maxAge: jwtConstants.refreshExpire
    });
    return {
      id,
      email,
      username,
      access_token,
      access_token_expire: jwtConstants.accessExpire,
      refresh_token,
      refresh_token_expire: jwtConstants.refreshExpire
    };
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Get('auth/refresh')
  async refreshAccessToken(@Res({ passthrough: true }) res, @Request() req) {
    const user = this.authService.cookieExtractor(req, 'refresh').decoded;
    const { access_token } = await this.authService.refreshAccessToken(user);
    res.cookie('access_token', access_token, {
      maxAge: jwtConstants.accessExpire
    });
    return { access_token };
  }


  @UseGuards(JwtAuthGuard)
  @Get('/check')
  check(@Req() req) {
    const accessToken = this.authService.cookieExtractor(req, 'access').token;
    const refreshToken = this.authService.cookieExtractor(req, 'refresh').token;
    if (!accessToken && !refreshToken) {
      return false;
    }
    const returnRes = async (type) => {
      const { id } = this.authService.cookieExtractor(
        req,
        type,
      ).decoded;
      const user = await this.userService.getUserById(id);
      if (user === 'user not found') return
      const { username, email } = user
      return { id, username, email };
    };
    if (accessToken) {
      return returnRes('access');
    }
    if (refreshToken) {
      return returnRes('refresh');
    }
  }
}
