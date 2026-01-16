import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async claimRewards(userId: string, rewardId: string) {
    const entity = await this.prisma.entity.findUnique({
      where: { userId },
      include: { state: true },
    });
    if (!entity || !entity.state) throw new NotFoundException('call /me first');
    const reward = await this.prisma.reward.findUnique({
      where: { id: rewardId },
    });
    if (!reward) throw new NotFoundException('reward not found');
    const unlocked =
      reward.type === 'streak'
        ? entity.state.streak >= reward.threshold
        : false;

    if (!unlocked) {
      throw new ConflictException('reward not yet unlocked');
    }

    try {
      await this.prisma.userRewards.create({
        data: { userId, rewardId },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('reward already claimed');
      }
      throw err;
    }
    return {ok: true, rewardId}
  }
}
