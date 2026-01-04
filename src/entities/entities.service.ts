import { Injectable } from '@nestjs/common';

@Injectable()
export class EntitiesService {
  getMeState(userId: string) {
    return {
      userId,
      energy: 50,
      loyalty: 0,
      fatigue: 0,
      level: 1,
    };
  }
}
