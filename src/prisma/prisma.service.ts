import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });
    super({ adapter });
    if (process.env.PRISMA_LOG_URL === 'true') {
      console.log('DATABASE_URL = ', process.env.DATABASE_URL);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
