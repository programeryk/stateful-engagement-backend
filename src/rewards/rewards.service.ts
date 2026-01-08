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
      select: { rewardId: true}
    });
    for (const reward of rewards) {
      let unlocked = false;
      let claimed = false;
      if (entity.state.streak >= reward.threshold) {
        unlocked = true;
      }
    }
    return {
      userId,
      locked: [{ id: 'streak_3', title: '3-day streak' }],
      unlocked: [],
      claimed: [],
    };
  }
}
