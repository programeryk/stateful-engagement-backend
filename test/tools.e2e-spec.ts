/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { registerAndLogin } from './helpers/auth';
import { PrismaService } from '../src/prisma/prisma.service';

interface InventoryItem {
  toolId: string;
  quantity: number;
}

describe('Tools (e2e)', () => {
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
    const server = app.getHttpServer();

    const me = await request(server)
      .get('/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const userId = me.body.user.id;

    const prisma = app.get(PrismaService);
    await prisma.userState.update({
      where: { userId },
      data: { loyalty: 9999 },
    });

    await request(server)
      .post('/tools/inventory/buy/coffee')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const inv1 = await request(server)
      .get('/tools/inventory')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const coffee1 = inv1.body.inventory.find(
      (x: InventoryItem) => x.toolId === 'coffee',
    );
    expect(coffee1).toBeTruthy();
    expect(coffee1?.quantity).toBeGreaterThanOrEqual(1);
    expect(inv1.body.capacity).toEqual({ max: 5, used: 1 });

    await request(server)
      .post('/tools/coffee/use')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const inv2 = await request(server)
      .get('/tools/inventory')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(
      inv2.body.inventory.find((x: InventoryItem) => x.toolId === 'coffee'),
    ).toBeFalsy();
    expect(inv2.body.capacity).toEqual({ max: 5, used: 0 });
    expect(inv2.body.inventory).toHaveLength(0);
  });

  it('use tool is race-safe (qty=1 -> one 201, one 409)', async () => {
    const { token } = await registerAndLogin(app);
    const server = app.getHttpServer();

    const me = await request(server)
      .get('/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const userId = me.body.user.id;

    const prisma = app.get(PrismaService);
    await prisma.userState.update({
      where: { userId },
      data: { loyalty: 9999 },
    });

    await request(server)
      .post('/tools/inventory/buy/coffee')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const [r1, r2] = await Promise.all([
      request(server)
        .post('/tools/coffee/use')
        .set('Authorization', `Bearer ${token}`),
      request(server)
        .post('/tools/coffee/use')
        .set('Authorization', `Bearer ${token}`),
    ]);

    const ok = (s: number) => s === 200 || s === 201;
    const statuses = [r1.status, r2.status];
    expect(statuses.some(ok)).toBe(true);
    expect(statuses).toContain(409);

    const inv = await prisma.userTool.findUnique({
      where: { userId_toolId: { userId, toolId: 'coffee' } },
    });

    expect(inv).toBeNull();
  });

  it('buy tool is race-safe (loyalty=10 -> one success, one 409, no negative loyalty)', async () => {
    const { token } = await registerAndLogin(app);
    const server = app.getHttpServer();

    const me = await request(server)
      .get('/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const userId = me.body.user.id;

    const prisma = app.get(PrismaService);

    await prisma.userState.update({
      where: { userId },
      data: { loyalty: 10 },
    });

    const [b1, b2] = await Promise.all([
      request(server)
        .post('/tools/inventory/buy/coffee')
        .set('Authorization', `Bearer ${token}`),
      request(server)
        .post('/tools/inventory/buy/coffee')
        .set('Authorization', `Bearer ${token}`),
    ]);

    const ok = (s: number) => s === 200 || s === 201;
    const statuses = [b1.status, b2.status];
    expect(statuses.some(ok)).toBe(true);
    expect(statuses).toContain(409);

    const row = await prisma.userTool.findUnique({
      where: { userId_toolId: { userId, toolId: 'coffee' } },
    });

    expect(row).toBeTruthy();
    expect(row!.quantity).toBe(1);

    const state = await prisma.userState.findUnique({ where: { userId } });
    expect(state).toBeTruthy();
    expect(state!.loyalty).toBe(0);

    const inv = await request(server)
      .get('/tools/inventory')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(inv.body.capacity).toEqual({ max: 5, used: 1 });
    expect(
      inv.body.inventory.find((x: InventoryItem) => x.toolId === 'coffee')
        ?.quantity,
    ).toBe(1);
  });
});
