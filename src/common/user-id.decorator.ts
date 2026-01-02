import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const userId = request.headers['x-user-id'];

    if (!userId) {
      throw new UnauthorizedException('X-User-Id header missing');
    }

    return userId;
  },
);
