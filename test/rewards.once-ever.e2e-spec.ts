/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { registerAndLogin } from './helpers/auth';

function utcDayWithOffset(daysOffset: number): Date {
  const now = new Date();
  const day = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  day.setUTCDate(day.getUTCDate() + daysOffset);
  return day;
}

describe('Rewards once-ever application (e2e)', () => {
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

  it('applies an eligible reward exactly once per user across repeated evaluations', async () => {
    const server = app.getHttpServer();
    const { token } = await registerAndLogin(app);

    const me = await request(server)
      .get('/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const userId = me.body.user.id as string;

    const reward = await prisma.reward.findFirst({
      where: { type: 'streak' },
      orderBy: [{ threshold: 'asc' }, { id: 'asc' }],
    });

    if (!reward) {
      throw new Error('No streak reward found in database');
    }

    const rewardId = reward.id;
    const targetStreakBeforeCheckin = Math.max(0, reward.threshold - 1);

    await prisma.userState.update({
      where: { userId },
      data: { streak: targetStreakBeforeCheckin },
    });

    await prisma.dailyCheckIn.create({
      data: { userId, date: utcDayWithOffset(-1) },
    });

    const beforeCount = await prisma.appliedReward.count({
      where: { userId, rewardId },
    });
    expect(beforeCount).toBe(0);

    await request(server)
      .post('/checkins')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const appliedCountAfterFirstTrigger = await prisma.appliedReward.count({
      where: { userId, rewardId },
    });

    expect(appliedCountAfterFirstTrigger).toBe(1);

    const userCheckins = await prisma.dailyCheckIn.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });

    expect(userCheckins).toHaveLength(2);

    await prisma.dailyCheckIn.update({
      where: { id: userCheckins[0].id },
      data: { date: utcDayWithOffset(-2) },
    });

    await prisma.dailyCheckIn.update({
      where: { id: userCheckins[1].id },
      data: { date: utcDayWithOffset(-1) },
    });

    await request(server)
      .post('/checkins')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const appliedCountAfterSecondTrigger = await prisma.appliedReward.count({
      where: { userId, rewardId },
    });

    expect(appliedCountAfterSecondTrigger).toBe(1);
  });
});
