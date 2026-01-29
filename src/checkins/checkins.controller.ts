import { Controller, Post, UseGuards } from '@nestjs/common';
import { UserId } from 'src/common/user-id.decorator';
import { CheckinsService } from './checkins.service';
import { JwtGuard } from 'src/auth/jwt.guard';

@UseGuards(JwtGuard)
@Controller('checkins')
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}
  @Post()
  postCheckIns(@UserId() userId: string) {
    return this.checkinsService.postCheckIns(userId);
  }
}
