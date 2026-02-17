import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CheckinsModule } from './checkins/checkins.module';
import { ToolsModule } from './tools/tools.module';
import { RewardsModule } from './rewards/rewards.module';
import { MeModule } from './me/me.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { validateEnv } from './config/validate-env';
import { HealthModule } from './health/health.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'test' ? ['.env.test', '.env'] : ['.env'],
      validate: validateEnv,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        autoLogging: {
          ignore: (req) => req.url?.startsWith('/health') ?? false,
        },
        genReqId: (req, res) => {
          const header = req.headers['x-request-id'];
          const requestId =
            (Array.isArray(header) ? header[0] : header) ?? randomUUID();
          res.setHeader('x-request-id', requestId);
          return requestId;
        },
      },
    }),
    ThrottlerModule.forRoot({
      skipIf: () =>
        process.env.NODE_ENV === 'test' &&
        process.env.ENABLE_THROTTLE_IN_TEST !== 'true',
      throttlers: [
        {
          name: 'default',
          ttl: 60_000,
          limit: 100,
        },
      ],
    }),
    PrismaModule,
    UsersModule,
    CheckinsModule,
    ToolsModule,
    RewardsModule,
    MeModule,
    AuthModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
