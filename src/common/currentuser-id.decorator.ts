import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: { userId: string };
}

export const CurrentUserId = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    if (req.user?.userId) {
      return req.user.userId;
    } else {
      throw new UnauthorizedException('Unathorized');
    }
  },
);
