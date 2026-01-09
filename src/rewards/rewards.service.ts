import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RewardsService {
  constructor(private prisma: PrismaService) {}

  async getRewards(userId: string) {
    const entity = await this.prisma.entity.findUnique({
      where: { userId },
      include: { state: true },
    });
    if (!entity || !entity.state) throw new NotFoundException('call /me first');

    const rewards = await this.prisma.reward.findMany();
    const userRewards = await this.prisma.userRewards.findMany({
      where: { userId },
      select: { rewardId: true },
    });
    const claimedIds = new Set(userRewards.map((r) => r.rewardId));
    const rewardsWithStatus = rewards.map((reward) => {
      const unlocked =
        reward.type === 'streak'
          ? entity.state!.streak >= reward.threshold
          : false; // later add "level" etc.

      const claimed = claimedIds.has(reward.id);
      return {
        id: reward.id,
        title: reward.title,
        description: reward.description,
        type: reward.type,
        threshold: reward.threshold,
        unlocked,
        claimed,
      };
    });
    return {
      userId,
      rewards: rewardsWithStatus,
    };
  }
}
