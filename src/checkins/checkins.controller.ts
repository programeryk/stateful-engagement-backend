import { Controller, Post } from '@nestjs/common';
import { UserId } from 'src/common/user-id.decorator';
import { CheckinsService } from './checkins.service';

@Controller('checkins')
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}
  @Post()
  postCheckIns(@UserId() userId: string) {
    return this.checkinsService.getCheckIns(userId);
  }
}
