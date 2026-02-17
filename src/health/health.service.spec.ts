import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('HealthService', () => {
  let service: HealthService;
  const prismaMock = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns 200 when database is reachable', async () => {
    prismaMock.$queryRaw.mockResolvedValue(1);

    const health = await service.getHealth();

    expect(health.httpStatus).toBe(200);
    expect(health.payload.status).toBe('ok');
    expect(health.payload.services.database).toBe('up');
  });

  it('returns 503 when database check fails', async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error('db down'));

    const health = await service.getHealth();

    expect(health.httpStatus).toBe(503);
    expect(health.payload.status).toBe('degraded');
    expect(health.payload.services.database).toBe('down');
  });
});
