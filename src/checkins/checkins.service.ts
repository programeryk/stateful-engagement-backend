import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CheckinsService {
  constructor(private prisma: PrismaService) {}
  async postCheckIns(userId: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    try {
      const checkIn = await this.prisma.dailyCheckIn.create({
        data: { userId, date: today },
      });
      return { ok: true, checkIn };
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('already checked in today.');
      }
      throw err;
    }
  }
}
