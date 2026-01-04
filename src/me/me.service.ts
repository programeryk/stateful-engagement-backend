import { Injectable } from '@nestjs/common';

@Injectable()
export class MeService {
  getMe(userId: string) {
    return {
      id: userId,
      email: 'mock@local',
    };
  }
}
