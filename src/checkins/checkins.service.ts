import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CheckinsService {
  constructor(private prisma: PrismaService) {}

  async postCheckIns(userId: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    try {
      //using transaction so that either both state and streak update or fail.
      const result = await this.prisma.$transaction(async (tx) => {
        const userState = await tx.userState.findUnique({
          where: { userId },
        });
        if (!userState) throw new NotFoundException('call /me first');

        //set the ongoing streak
        const existsYesterday = await tx.dailyCheckIn.findUnique({
          where: { userId_date: { userId, date: yesterday } },
        });
        const checkIn = await tx.dailyCheckIn.create({
          data: { userId, date: today },
        });
        const newStreak = existsYesterday ? userState.streak + 1 : 1;

        //update base meters for check in
        const baseEnergyGain = 20;
        const baseFatigueGain = 10;
        const baseLoyaltyGain = 1;

        const updatedState = await tx.userState.update({
          where: { userId },
          data: {
            streak: newStreak,
            energy: { increment: baseEnergyGain },
            fatigue: { increment: baseFatigueGain },
            loyalty: { increment: baseLoyaltyGain },
          },
        });

        //reward auto apply
        const eligibleRewards = await tx.reward.findMany({
          where: {
            type: 'streak',
            threshold: { lte: newStreak },
          },
        });

        const alreadyApplied = await tx.appliedReward.findMany({
          where: { userId },
          select: { rewardId: true },
        });
        const appliedIds = new Set(alreadyApplied.map((r) => r.rewardId));

        const newlyApplied: Array<{ rewardId: string; title: string }> = [];

        for (const reward of eligibleRewards) {
          if (appliedIds.has(reward.id)) continue;

          // effects is Json? like { loyalty: 50, energy: 10 }
          const effects = (reward.effects ?? {}) as any;

          await tx.userState.update({
            where: { userId },
            data: {
              loyalty: effects.loyalty
                ? { increment: effects.loyalty }
                : undefined,
              energy: effects.energy
                ? { increment: effects.energy }
                : undefined,
              fatigue: effects.fatigue
                ? { increment: effects.fatigue }
                : undefined,
            },
          });

          await tx.appliedReward.create({
            data: { userId, rewardId: reward.id },
          });

          newlyApplied.push({ rewardId: reward.id, title: reward.title });
        }
        const finalState = await tx.userState.findUnique({ where: { userId } });

        return {
          ok: true,
          checkIn,
          streak: newStreak,
          newlyApplied,
          state: finalState,
        };
      });

      return result;
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('already checked in today.');
      }
      throw err;
    }
  }
}
