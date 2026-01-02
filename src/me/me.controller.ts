import { Controller, Get } from '@nestjs/common';
import { UserId } from 'src/common/user-id.decorator';

@Controller()
export class MeController {
  @Get('me')
  getMe(@UserId() userId: string) {
    return {
      id: userId,
      email: 'mock@local',
    };
  }
}
