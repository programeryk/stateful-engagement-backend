import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ToolsService {
  constructor(private prisma: PrismaService) {}

  async getTools() {
    const tools = await this.prisma.toolDefinition.findMany({
      orderBy: { price: 'asc' },
    });
    return tools;
  }

  async getInventory(userId: string) {
    const inventory = await this.prisma.userTool.findMany({
      where: { userId },
      include: { tool: true },
    });
    const used = inventory.length;
    return {
      userId,
      capacity: { max: 5, used },
      inventory,
    };
  }
}
