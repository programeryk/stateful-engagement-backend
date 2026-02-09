import request from 'supertest';
import { INestApplication } from '@nestjs/common';

interface AuthResponse {
  token: string;
  email: string;
}

export async function registerAndLogin(
  app: INestApplication,
  email?: string,
): Promise<AuthResponse> {
  const em = email ?? `test_${Date.now()}@x.com`;
  const password = 'pass1234';

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const server = app.getHttpServer();
  const registerRes = await request(server)
    .post('/auth/register')
    .send({ email: em, password });

  if (![200, 201].includes(registerRes.status)) {
    throw new Error(
      `Register failed: ${registerRes.status} ${JSON.stringify(
        registerRes.body,
      )}`,
    );
  }

  const loginRes = await request(server)
    .post('/auth/login')
    .send({ email: em, password });

  if (![200, 201].includes(loginRes.status)) {
    throw new Error(
      `Login failed: ${loginRes.status} ${JSON.stringify(loginRes.body)}`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const token = loginRes.body?.accessToken as string | undefined;
  if (!token) {
    throw new Error(
      `no accessToken in /auth/login response: ${JSON.stringify(
        loginRes.body,
      )}`,
    );
  }
  return { token, email: em };
}
