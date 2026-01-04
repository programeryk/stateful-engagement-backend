import { Controller, Get } from '@nestjs/common';
import { UserId } from 'src/common/user-id.decorator';
import { MeService } from './me.service';

@Controller()
export class MeController {
  constructor(private readonly meSerivce: MeService) {}
  @Get('me')
  getMe(@UserId() userId: string) {
    return this.meSerivce.getMe(userId);
  }
}
