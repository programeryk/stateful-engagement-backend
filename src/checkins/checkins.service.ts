import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { applyStateChanges } from 'src/common/state-rules';

@Injectable()
export class CheckinsService {
  constructor(private prisma: PrismaService) {}

  async postCheckIns(userId: string) {
    type RewardEffects = {
      loyalty?: number;
      energy?: number;
      fatigue?: number;
    };
    const now = new Date();
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    try {
      //using transaction so that either both state and streak update or fail.
      const result = await this.prisma.$transaction(async (tx) => {
        //find at most one row from the userState table by using a field that is unique or primary key - user id
        const userState = await tx.userState.findUnique({
          where: { userId },
        });
        if (!userState) throw new NotFoundException('call /me first'); //if doesnt exist then throw NFE

        //1. set the ongoing streak
        //find at most one row using the fields that are unique - userId and date that matches yesterday
        const existsYesterday = await tx.dailyCheckIn.findUnique({
          where: { userId_date: { userId, date: yesterday } },
        });
        const newStreak = existsYesterday ? userState.streak + 1 : 1;

        //find all rows that will be eligble rewards. Of type streak and where the threshold is less than/equal to the user's streak
        const eligibleRewards = await tx.reward.findMany({
          where: {
            type: 'streak',
            threshold: { lte: newStreak },
          },
        });

        //insert a new row into the dailyCheckIn table with column values of usrId and date: today
        //Prisma generates SQL INSERT, sends to postgres and returns the created row into checkIn
        const checkIn = await tx.dailyCheckIn.create({
          data: { userId, date: today },
        });

        //2. update base meters for check in
        const baseEnergyGain = 20;
        const baseFatigueGain = 10;
        const baseLoyaltyGain = 5;
        //reward auto apply
        //take alreadyApplied array, for each item r extract r.rewardId into a Set. Using Set for O(1) lookup (only uniques in a Set)
        const newlyApplied: Array<{ rewardId: string; title: string }> = [];

        let loyaltyDelta = baseLoyaltyGain;
        let energyDelta = baseEnergyGain;
        let fatigueDelta = baseFatigueGain;

        for (const reward of eligibleRewards) {
          try {
            // try to mark reward as applied (db enforces once ever)
            await tx.appliedReward.create({
              data: { userId, rewardId: reward.id },
            });
          } catch (err: any) {
            if (err?.code === 'P2002') {
              // already applied (maybe by another concurrent request) -> skip effects
              continue;
            }
            throw err;
          }

          // only if we successfully created AppliedReward do we add effects
          const effects = (reward.effects ?? {}) as RewardEffects;

          if (typeof effects.loyalty === 'number')
            loyaltyDelta += effects.loyalty;
          if (typeof effects.energy === 'number') energyDelta += effects.energy;
          if (typeof effects.fatigue === 'number')
            fatigueDelta += effects.fatigue;

          newlyApplied.push({ rewardId: reward.id, title: reward.title });
        }

        const { next, meta } = applyStateChanges(userState, {
          streak: newStreak,
          energyDelta,
          fatigueDelta,
          loyaltyDelta,
        });

        const finalState = await tx.userState.update({
          where: { userId },
          data: next,
        });

        return {
          ok: true,
          checkIn,
          streak: newStreak,
          newlyApplied,
          state: finalState,
          meta,
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
