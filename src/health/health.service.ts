import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import packageJson from '../../package.json';

export type HealthPayload = {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: 'up' | 'down';
  };
};

export type HealthResult = {
  httpStatus: number;
  payload: HealthPayload;
};

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  async getHealth(): Promise<HealthResult> {
    const timestamp = new Date().toISOString();
    const uptime = Math.floor(process.uptime());
    const version = packageJson.version;
    let dbStatus: 'up' | 'down' = 'up';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'down';
    }

    const payload: HealthPayload = {
      status: dbStatus === 'up' ? 'ok' : 'degraded',
      timestamp,
      uptime,
      version,
      services: {
        database: dbStatus,
      },
    };

    return {
      httpStatus:
        payload.status === 'ok'
          ? HttpStatus.OK
          : HttpStatus.SERVICE_UNAVAILABLE,
      payload,
    };
  }
}
