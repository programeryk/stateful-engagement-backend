import { Controller, Post, UseGuards } from '@nestjs/common';
import { CheckinsService } from './checkins.service';
import { JwtGuard } from 'src/auth/jwt.guard';
import { CurrentUserId } from 'src/common/currentuser-id.decorator';

@UseGuards(JwtGuard)
@Controller('checkins')
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}
  @Post()
  postCheckIns(@CurrentUserId() userId: string) {
    return this.checkinsService.postCheckIns(userId);
  }
}
