import { Controller, Get } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';

@Controller('entities')
export class EntitiesController {

    @Get('me/state')
    getMeState(@UserId() userId: string) {
        return {
            userId,
            energy: 50,
            loyalty: 0,
            fatigue: 0,
            level: 1,
        }
    }
}
