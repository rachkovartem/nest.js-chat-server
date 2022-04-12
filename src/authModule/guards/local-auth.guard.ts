import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LocalStrategy } from '../local.strategy';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  constructor(private readonly localstrategy: LocalStrategy) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return this.localstrategy.validate(
      context.getArgs()[0].body.email,
      context.getArgs()[0].body.password,
    );
  }
}
