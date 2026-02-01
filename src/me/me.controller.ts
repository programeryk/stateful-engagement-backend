import { Controller, Get, UseGuards } from '@nestjs/common';
import { MeService } from './me.service';
import { JwtGuard } from 'src/auth/jwt.guard';
import { CurrentUserId } from 'src/common/currentuser-id.decorator';

@UseGuards(JwtGuard)
@Controller()
export class MeController {
  constructor(private readonly meSerivce: MeService) {}
  @Get('me')
  getMe(@CurrentUserId() userId: string) {
    return this.meSerivce.getMe(userId);
  }
}
