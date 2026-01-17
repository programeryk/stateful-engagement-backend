import { Controller, Get, Param, Post } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { RewardsService } from './rewards.service';

@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}
  @Get()
  getRewards(@UserId() userId: string) {
    return this.rewardsService.getRewards(userId);
  }
  @Post(':rewardId/claim')
  claimReward(@UserId() userId: string, @Param('rewardId') rewardId: string) {
    return this.rewardsService.claimRewards(userId, rewardId);
  }
}