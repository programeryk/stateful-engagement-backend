import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect({
        name: 'Stateful Engagement Backend',
        message: 'API is running. Open /api for Swagger and test endpoints.',
        version: 'v1',
        docs: '/api',
        health: '/health',
        endpoints: [
          { name: 'Auth', path: '/auth' },
          { name: 'Check-ins', path: '/checkins' },
          { name: 'Tools', path: '/tools' },
          { name: 'Rewards', path: '/rewards' },
          { name: 'Profile', path: '/me' },
        ],
      });
  });
});
