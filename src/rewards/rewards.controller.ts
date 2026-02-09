import { Controller, Get, UseGuards } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { JwtGuard } from 'src/auth/jwt.guard';
import { CurrentUserId } from 'src/common/currentuser-id.decorator';

@UseGuards(JwtGuard)
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}
  @Get()
  getRewards(@CurrentUserId() userId: string) {
    return this.rewardsService.getRewards(userId);
  }
}
