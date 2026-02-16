import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiParam,
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { ToolsService } from './tools.service';
import { JwtGuard } from 'src/auth/jwt.guard';
import { CurrentUserId } from 'src/common/currentuser-id.decorator';
import { ToolIdParamDto } from './dto/tool-id-param.dto';

@ApiTags('tools')
@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Get()
  @ApiOperation({ summary: 'Get available tools catalog' })
  getTools() {
    return this.toolsService.getTools();
  }

  @UseGuards(JwtGuard)
  @Get('inventory')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user inventory' })
  getInventory(@CurrentUserId() userId: string) {
    return this.toolsService.getInventory(userId);
  }

  @UseGuards(JwtGuard)
  @Post('inventory/buy/:toolId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buy a tool with loyalty' })
  @ApiParam({
    name: 'toolId',
    required: true,
    example: 'coffee',
    description: 'Tool ID from GET /tools (e.g., coffee, rest, focus)',
  })
  @ApiResponse({ status: 201, description: 'Tool purchased' })
  @ApiResponse({
    status: 409,
    description: 'Not enough loyalty or inventory full',
  })
  buyTool(@CurrentUserId() userId: string, @Param() params: ToolIdParamDto) {
    return this.toolsService.buyTool(userId, params.toolId);
  }

  @UseGuards(JwtGuard)
  @Post(':toolId/use')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Use a tool from inventory' })
  @ApiParam({
    name: 'toolId',
    required: true,
    example: 'coffee',
    description: 'Tool ID currently present in user inventory',
  })
  @ApiResponse({ status: 200, description: 'Tool used and effects applied' })
  @ApiResponse({ status: 409, description: 'Tool not in inventory' })
  useTool(@CurrentUserId() userId: string, @Param() params: ToolIdParamDto) {
    return this.toolsService.useTool(userId, params.toolId);
  }
}
