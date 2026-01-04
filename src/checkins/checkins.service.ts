import { Injectable } from '@nestjs/common';

@Injectable()
export class CheckinsService {
  getCheckIns(userId: string) {
    return {
      ok: true,
      userId,
    };
  }
}
