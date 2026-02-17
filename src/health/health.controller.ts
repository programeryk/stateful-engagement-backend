import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async health(@Res({ passthrough: true }) res: Response) {
    const health = await this.healthService.getHealth();
    res.status(health.httpStatus);
    return health.payload;
  }
}
