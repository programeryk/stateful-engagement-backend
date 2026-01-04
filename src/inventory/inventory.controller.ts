import { Controller, Get } from '@nestjs/common';
import { UserId } from 'src/common/user-id.decorator';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  getInventory(@UserId() userId: string) {
    return this.inventoryService.getInventory(userId);
  }
}
