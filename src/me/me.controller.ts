import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserId } from 'src/common/user-id.decorator';
import { MeService } from './me.service';
import { JwtGuard } from 'src/auth/jwt.guard';

@UseGuards(JwtGuard)
@Controller()
export class MeController {
  constructor(private readonly meSerivce: MeService) {}
  @Get('me')
  getMe(@UserId() userId: string) {
    return this.meSerivce.getMe(userId);
  }
}
