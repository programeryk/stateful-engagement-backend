import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CheckinsService } from './checkins.service';
import { JwtGuard } from 'src/auth/jwt.guard';
import { CurrentUserId } from 'src/common/currentuser-id.decorator';

@ApiTags('checkins')
@UseGuards(JwtGuard)
@ApiBearerAuth()
@Controller('checkins')
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  @Post()
  @ApiOperation({ summary: 'Daily check-in (once per UTC day)' })
  @ApiResponse({ status: 201, description: 'Check-in successful, state updated' })
  @ApiResponse({ status: 409, description: 'Already checked in today' })
  postCheckIns(@CurrentUserId() userId: string) {
    return this.checkinsService.postCheckIns(userId);
  }
}
