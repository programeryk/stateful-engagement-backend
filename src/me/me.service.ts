import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MeService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        createdAt: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    const state = await this.prisma.userState.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    return { user, state };
  }

  async grantLoyalty(userId: string, amount: number) {
    const state = await this.prisma.userState.upsert({
      where: { userId },
      update: {
        loyalty: {
          increment: amount,
        },
      },
      create: { userId, loyalty: amount },
    });

    return {
      ok: true,
      granted: amount,
      state,
    };
  }
}
