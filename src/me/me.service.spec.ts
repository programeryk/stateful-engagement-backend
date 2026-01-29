import { Test, TestingModule } from '@nestjs/testing';
import { MeService } from './me.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('MeService', () => {
  let service: MeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get(MeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
