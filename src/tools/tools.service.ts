import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ToolsService {
  constructor(private prisma: PrismaService) {}

  getTools() {
    const tools = this.prisma.toolDefinition.findMany({
      orderBy: { price: 'asc' },
    });
    return tools;
  }
}
