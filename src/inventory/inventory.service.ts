import { Injectable } from '@nestjs/common';

@Injectable()
export class InventoryService {
  getInventory(userId: string) {
    return {
      userId,
      items: [
        { toolId: 'coffee', qty: 2 },
        { toolId: 'nap', qty: 1 },
      ],
    };
  }
}
