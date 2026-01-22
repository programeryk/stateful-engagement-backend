import { Controller, Get, Param, Post } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { UserId } from 'src/common/user-id.decorator';

@Controller()
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}
  @Get('tools')
  getTools() {
    return this.toolsService.getTools();
  }
  @Get('inventory')
  getInventory(@UserId() userId: string) {
    return this.toolsService.getInventory(userId);
  }
  @Post('inventory/buy/:toolId')
  buyTool(@UserId() userId: string, @Param('toolId') toolId: string) {
    return this.toolsService.buyTool(userId, toolId);
  }
}
