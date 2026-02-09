import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { JwtGuard } from 'src/auth/jwt.guard';
import { CurrentUserId } from 'src/common/currentuser-id.decorator';
import { ToolIdParamDto } from './dto/tool-id-param.dto';

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
  buyTool(@CurrentUserId() userId: string, @Param() params: ToolIdParamDto) {
    return this.toolsService.buyTool(userId, params.toolId);
  }
  @UseGuards(JwtGuard)
  @Post(':toolId/use')
  useTool(@CurrentUserId() userId: string, @Param() params: ToolIdParamDto) {
    return this.toolsService.useTool(userId, params.toolId);
  }
}
