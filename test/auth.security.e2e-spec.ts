/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/app.module';

describe('Auth security (e2e)', () => {
  let app: INestApplication;
  const email = `race_${Date.now()}@x.com`;
  const password = 'pass1234';

  beforeAll(async () => {
    process.env.ENABLE_THROTTLE_IN_TEST = 'true';
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    delete process.env.ENABLE_THROTTLE_IN_TEST;
    await app.close();
  });

  it('register race: one succeeds and one conflicts (never 500)', async () => {
    const server = app.getHttpServer();

    const [r1, r2] = await Promise.all([
      request(server).post('/auth/register').send({ email, password }),
      request(server).post('/auth/register').send({ email, password }),
    ]);

    const statuses = [r1.status, r2.status];
    expect(statuses).toContain(201);
    expect(statuses).toContain(409);
    expect(statuses).not.toContain(500);
  });

  it('login is rate limited after repeated failed attempts', async () => {
    const server = app.getHttpServer();
    const attempts = 11;
    const statuses: number[] = [];

    for (let i = 0; i < attempts; i += 1) {
      const res = await request(server).post('/auth/login').send({
        email,
        password: 'wrong-password',
      });
      statuses.push(res.status);
    }

    expect(statuses).toContain(429);
  });
});
