import { Injectable } from '@nestjs/common';

@Injectable()
export class RewardsService {
  getRewards(userId: string) {
    return {
      userId,
      locked: [{ id: 'streak_3', title: '3-day streak' }],
      unlocked: [],
      claimed: [],
    };
  }
}
