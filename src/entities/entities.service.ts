import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EntitiesService {
  constructor(private prisma: PrismaService) {}

  async getMeState(userId: string) {
    const entity = await this.prisma.entity.findUnique({
      where: { userId },
      include: { state: true },
    });

    if (!entity) {
      throw new NotFoundException('entity not found');
    }
    if (!entity.state) {
      throw new NotFoundException('state not found');
    }

    return entity.state;
  }
}