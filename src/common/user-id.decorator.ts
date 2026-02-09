import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: { userId: string };
}

export const UserId = createParamDecorator((data, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

  if (req.user?.userId) return req.user.userId;

  // dev fallback
  const headerId = req.headers['x-user-id'];
  if (headerId) return headerId;

  throw new UnauthorizedException('Missing auth');
});
