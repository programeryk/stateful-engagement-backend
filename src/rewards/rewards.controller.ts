import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RewardsService } from './rewards.service';
import { JwtGuard } from 'src/auth/jwt.guard';
import { CurrentUserId } from 'src/common/currentuser-id.decorator';

@ApiTags('rewards')
@UseGuards(JwtGuard)
@ApiBearerAuth()
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user rewards and unlocked status' })
  getRewards(@CurrentUserId() userId: string) {
    return this.rewardsService.getRewards(userId);
  }
}
