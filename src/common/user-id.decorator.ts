import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const UserId = createParamDecorator((data, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();

  if (req.user?.userId) return req.user.userId;

  // dev fallback
  const headerId = req.headers['x-user-id'];
  if (headerId) return headerId;

  throw new UnauthorizedException('Missing auth');
});
