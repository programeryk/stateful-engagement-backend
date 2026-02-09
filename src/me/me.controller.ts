import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
}
