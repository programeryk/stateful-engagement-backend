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

    const exists = await this.prisma.dailyCheckIn.findUnique({
      where: { userId_date: { userId, date: yesterday } },
    });

    const entity = await this.prisma.entity.findUnique({
      where: { userId },
      include: { state: true },
    });
    if (!entity) {
      throw new NotFoundException('call /me first');
    }
    try {
      const checkIn = await this.prisma.dailyCheckIn.create({
        data: { userId, date: today },
      });

      if (exists) {
        entity!.state!.streak += 1;
      } else {
        state!.streak = 1;
      }

      return { ok: true, checkIn };
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('already checked in today.');
      }
      throw err;
    }
  }
}
