import { Controller, Get } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { EntitiesService } from './entities.service';

@Controller('entities')
export class EntitiesController {
  constructor(private readonly entitiesService: EntitiesService) {}

  @Get('me/state')
  getMeState(@UserId() userId: string) {
    return this.entitiesService.getMeState(userId);
  }
}
