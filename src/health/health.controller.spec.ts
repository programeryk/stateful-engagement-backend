import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  const healthServiceMock = {
    getHealth: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: healthServiceMock,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('returns payload without setting status when healthy', async () => {
    healthServiceMock.getHealth.mockResolvedValue({
      httpStatus: 200,
      payload: {
        status: 'ok',
        services: { database: 'up' },
      },
    });
    const res = { status: jest.fn() };

    const out = await controller.health(res as never);

    expect(out.status).toBe('ok');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('sets 503 when degraded', async () => {
    healthServiceMock.getHealth.mockResolvedValue({
      httpStatus: 503,
      payload: {
        status: 'degraded',
        services: { database: 'down' },
      },
    });
    const res = { status: jest.fn() };

    const out = await controller.health(res as never);

    expect(out.status).toBe('degraded');
    expect(res.status).toHaveBeenCalledWith(503);
  });
});
