import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isTokenValid = (await super.canActivate(context)) as boolean;
    return isTokenValid;
  }

  handleRequest(err, user, info: Error) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
