import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { UserId } from 'src/common/user-id.decorator';
import { JwtGuard } from 'src/auth/jwt.guard';
import { CurrentUserId } from 'src/common/currentuser-id.decorator';

@UseGuards(JwtGuard)
@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}
  @Get()
  getTools() {
    return this.toolsService.getTools();
  }
  @Get('inventory')
  getInventory(@CurrentUserId() userId: string) {
    return this.toolsService.getInventory(userId);
  }
  @Post('inventory/buy/:toolId')
  buyTool(@CurrentUserId() userId: string, @Param('toolId') toolId: string) {
    return this.toolsService.buyTool(userId, toolId);
  }
  @Post(':toolId/use')
  useTool(@CurrentUserId() userId: string, @Param('toolId') toolId: string) {
    return this.toolsService.useTool(userId, toolId);
  }
}
