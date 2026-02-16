import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { registerAndLogin } from './helpers/auth';
import { PrismaService } from 'src/prisma/prisma.service';

describe('Database constraints (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects invalid user state values at DB layer', async () => {
    const { email } = await registerAndLogin(app);
    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
      select: { id: true },
    });

    await expect(
      prisma.userState.update({
        where: { userId: user.id },
        data: { energy: 101 },
      }),
    ).rejects.toBeTruthy();
  });

  it('rejects negative inventory quantity at DB layer', async () => {
    const { email } = await registerAndLogin(app);
    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
      select: { id: true },
    });

    await prisma.userTool.create({
      data: {
        userId: user.id,
        toolId: 'coffee',
        quantity: 1,
      },
    });

    await expect(
      prisma.userTool.update({
        where: { userId_toolId: { userId: user.id, toolId: 'coffee' } },
        data: { quantity: -1 },
      }),
    ).rejects.toBeTruthy();
  });
});
