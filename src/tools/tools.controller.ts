import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { UserId } from 'src/common/user-id.decorator';
import { JwtGuard } from 'src/auth/jwt.guard';
import { CurrentUserId } from 'src/common/currentuser-id.decorator';

@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}
  @Get()
  getTools() {
    return this.toolsService.getTools();
  }
  @UseGuards(JwtGuard)
  @Get('inventory')
  getInventory(@CurrentUserId() userId: string) {
    return this.toolsService.getInventory(userId);
  }
  @UseGuards(JwtGuard)
  @Post('inventory/buy/:toolId')
  buyTool(@CurrentUserId() userId: string, @Param('toolId') toolId: string) {
    return this.toolsService.buyTool(userId, toolId);
  }
  @UseGuards(JwtGuard)
  @Post(':toolId/use')
  useTool(@CurrentUserId() userId: string, @Param('toolId') toolId: string) {
    return this.toolsService.useTool(userId, toolId);
  }
}
