import { Controller, Post } from '@nestjs/common';
import { UserId } from 'src/common/user-id.decorator';

@Controller('checkins')
export class CheckinsController {
  @Post()
  postCheckIns(@UserId() userId: string) {
    return {
      ok: true,
      userId,
    };
  }
}
