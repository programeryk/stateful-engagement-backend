import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RewardsService {
  constructor(private prisma: PrismaService) {}

  async getRewards(userId: string) {
    const userState = await this.prisma.userState.findUnique({
      where: { userId },
    });
    if (!userState) throw new NotFoundException('call /me first');

    const rewards = await this.prisma.reward.findMany();

    const applied = await this.prisma.appliedReward.findMany({
      where: { userId },
      select: { rewardId: true },
    });

    const appliedIds = new Set(applied.map((r) => r.rewardId));

    const rewardsWithStatus = rewards.map((reward) => {
      const unlockedNow =
        reward.type === 'streak'
          ? userState.streak >= reward.threshold
          : false;

      const appliedEver = appliedIds.has(reward.id);

      return {
        id: reward.id,
        title: reward.title,
        description: reward.description,
        type: reward.type,
        threshold: reward.threshold,
        unlockedNow,
        appliedEver,
      };
    });

    return { userId, rewards: rewardsWithStatus };
  }
}