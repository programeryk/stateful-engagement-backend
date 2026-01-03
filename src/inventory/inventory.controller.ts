import { Controller, Get } from '@nestjs/common';
import { UserId } from 'src/common/user-id.decorator';

@Controller('inventory')
export class InventoryController {
  @Get()
  getInventory(@UserId() userId: string) {
    return {
      userId,
      items: [
        { toolId: 'coffee', qty: 2 },
        { toolId: 'nap', qty: 1 },
      ],
    };
  }
}
