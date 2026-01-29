import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Checkins (e2e)', () => {
  let app: INestApplication;
  const userId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /checkins should succeed once and fail second time same day', async () => {
    // bootstrap user/state
    await request(app.getHttpServer())
      .get('/me')
      .set('X-User-Id', userId)
      .expect(200);

    // 1st checkin ok
    await request(app.getHttpServer())
      .post('/checkins')
      .set('X-User-Id', userId)
      .expect(201);

    // 2nd checkin same day -> 409
    await request(app.getHttpServer())
      .post('/checkins')
      .set('X-User-Id', userId)
      .expect(409);
  });
});
