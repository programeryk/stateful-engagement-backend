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
        
        const exists = await tx.dailyCheckIn.findUnique({
          where: { userId_date: { userId, date: yesterday } },
        });
        const checkIn = await tx.dailyCheckIn.create({
          data: { userId, date: today },
        });

        const newStreak = exists ? userState.streak + 1 : 1;

        const state = await tx.userState.update({
          where: { userId },
          data: { streak: newStreak },
        });

        return { ok: true, checkIn, streak: state.streak };
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
