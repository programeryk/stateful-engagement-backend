import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/http-exception-filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const isProduction = process.env.NODE_ENV === 'production';
  const corsOriginRaw = process.env.CORS_ORIGIN?.trim() ?? '';
  const corsOrigins = corsOriginRaw
    ? corsOriginRaw
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];

  if (isProduction && corsOrigins.length === 0) {
    throw new Error('CORS_ORIGIN must be set in production');
  }

  app.enableShutdownHooks();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  app.use(json({ limit: '100kb' }));
  app.use(urlencoded({ extended: true, limit: '100kb' }));
  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Stateful Engagement Backend')
    .setDescription(
      [
        'Deterministic, stateful engagement loop with transactions and invariant enforcement.',
        '',
        'How to use this Swagger:',
        '1) Call POST /auth/register (or /auth/login) to get accessToken.',
        '2) Click "Authorize" and enter: Bearer <accessToken>.',
        '3) Call protected endpoints (/me, /checkins, /rewards, /tools/inventory, ...).',
      ].join('\n'),
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
