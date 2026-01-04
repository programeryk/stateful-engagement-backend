import { Injectable } from '@nestjs/common';

@Injectable()
export class CheckinsService {
  postCheckIns(userId: string) {
    return {
      ok: true,
      userId,
    };
  }
}
