import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MeService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });
    const entity = await this.prisma.entity.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    const state = await this.prisma.entityState.upsert({
      where: { entityId: entity.id },
      update: {},
      create: { entityId: entity.id },
    });

    return {
      user,
      entity,
      state,
    };
  }
}
