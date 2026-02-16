import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { MeService } from './me.service';
import { JwtGuard } from 'src/auth/jwt.guard';
import { CurrentUserId } from 'src/common/currentuser-id.decorator';

@ApiTags('user')
@UseGuards(JwtGuard)
@ApiBearerAuth()
@Controller()
export class MeController {
  constructor(private readonly meSerivce: MeService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile and state' })
  getMe(@CurrentUserId() userId: string) {
    return this.meSerivce.getMe(userId);
  }

  @Post('me/dev/grant-loyalty/:amount')
  @ApiOperation({
    summary: 'DEV ONLY: grant loyalty to current user',
    description:
      'Requires ENABLE_DEV_SIMULATION=true. Intended for local/manual testing only.',
  })
  @ApiParam({
    name: 'amount',
    example: 100,
    description: 'Positive integer amount to add to loyalty',
  })
  @ApiResponse({ status: 201, description: 'Loyalty granted' })
  @ApiResponse({ status: 400, description: 'Invalid amount' })
  @ApiResponse({
    status: 404,
    description: 'Endpoint disabled (ENABLE_DEV_SIMULATION not enabled)',
  })
  grantLoyalty(
    @CurrentUserId() userId: string,
    @Param('amount', ParseIntPipe) amount: number,
  ) {
    if (process.env.ENABLE_DEV_SIMULATION !== 'true') {
      throw new NotFoundException('endpoint not available');
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException('amount must be a positive integer');
    }
    return this.meSerivce.grantLoyalty(userId, amount);
  }
}
