import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { StateModule } from './state/state.module';
import { CheckinsModule } from './checkins/checkins.module';
import { ToolsModule } from './tools/tools.module';
import { InventoryModule } from './inventory/inventory.module';
import { RewardsModule } from './rewards/rewards.module';
import { MeController } from './me/me.controller';
import { MeService } from './me/me.service';
import { MeModule } from './me/me.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    StateModule,
    CheckinsModule,
    ToolsModule,
    InventoryModule,
    RewardsModule,
    MeModule,
  ],
  controllers: [AppController, MeController],
  providers: [AppService, MeService],
})
export class AppModule {}
