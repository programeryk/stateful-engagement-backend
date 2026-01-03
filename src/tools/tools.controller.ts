import { Controller, Get } from '@nestjs/common';
import { UserId } from 'src/common/user-id.decorator';

@Controller('tools')
export class ToolsController {
  @Get()
  getTools() {
    return [
      {
        id: 'coffee',
        name: 'Coffee',
        cooldownHours: 24,
        effects: { energy: +10, fatigue: +2 },
      },
      {
        id: 'nap',
        name: 'Nap',
        cooldownHours: 12,
        effects: { energy: +5, fatigue: -10 },
      },
    ];
  }
}
