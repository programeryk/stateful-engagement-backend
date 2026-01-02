import { Controller, Get } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';

@Controller('rewards')
export class RewardsController {
    @Get()
    getRewards(@UserId() userId: string) {
        return {
            userId,
            locked: [{ "id": "streak_3", "title": "3-day streak" }],
            unlocked: [],
            claimed: [],
        }
    }
}
