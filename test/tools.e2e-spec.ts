import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { registerAndLogin } from './helpers/auth';
import { PrismaService } from '../src/prisma/prisma.service';

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

  it('can buy and use a tool', async () => {
    const { token } = await registerAndLogin(app);

    const me = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const userId = me.body.user.id;

    const prisma = app.get(PrismaService);
    await prisma.userState.update({
      where: { userId },
      data: { loyalty: 9999 },
    });

    await request(app.getHttpServer())
      .post('/tools/inventory/buy/coffee')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const inv1 = await request(app.getHttpServer())
      .get('/tools/inventory')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app.getHttpServer())
      .post('/tools/coffee/use')
      .set('Authorization', `Bearer ${token}`)
      .expect(201); 

    const inv2 = await request(app.getHttpServer())
      .get('/tools/inventory')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

  });
});
