import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { registerAndLogin } from './helpers/auth';

describe('Checkins (e2e)', () => {
  let app: INestApplication;

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

  it('POST /checkins should require auth', async () => {
    await request(app.getHttpServer()).post('/checkins').expect(401);
  });

  it('POST /checkins should succeed once and fail second time same day', async () => {
    const { token } = await registerAndLogin(app);

    await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app.getHttpServer())
      .post('/checkins')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    await request(app.getHttpServer())
      .post('/checkins')
      .set('Authorization', `Bearer ${token}`)
      .expect(409);
  });
});
