import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const CurrentUserId = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();

    if (req.user?.userId) {
      return req.user.userId;
    } else {
      throw new UnauthorizedException('Unathorized');
    }
  },
);
