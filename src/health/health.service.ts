import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import packageJson from '../../package.json';

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  async getHealth() {
    const timestamp = new Date().toISOString();
    const uptime = Math.floor(process.uptime());
    const version = packageJson.version;
    let dbStatus = 'up';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'down';
    }

    return {
      status: dbStatus === 'up' ? 'ok' : 'degraded',
      timestamp,
      uptime,
      version,
      services: {
        database: dbStatus,
      },
    };
  }
}
