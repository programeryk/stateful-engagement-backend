import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
  async buyTool(userId: string, toolId: string) {
    const MAX_UNIQUE = 5;

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          // 1. Tool exists?
          const tool = await tx.toolDefinition.findUnique({
            where: { id: toolId },
          });
          if (!tool) throw new NotFoundException('tool not found');

          // 2. Ensure state exists
          const state = await tx.userState.upsert({
            where: { userId },
            update: {},
            create: { userId },
          });

          // 3. Load existing inventory row (if any)
          const existing = await tx.userTool.findUnique({
            where: { userId_toolId: { userId, toolId } },
          });

          // 4. Capacity check only if it's a NEW tool type (no row yet or qty <= 0)
          if (!existing || existing.quantity <= 0) {
            const uniqueCount = await tx.userTool.count({
              where: { userId, quantity: { gt: 0 } },
            });
            if (uniqueCount >= MAX_UNIQUE) {
              throw new ConflictException(
                `inventory capacity ${MAX_UNIQUE} reached`,
              );
            }
          }

          // 5. Loyalty check
          if (state.loyalty < tool.price) {
            throw new ConflictException('not enough loyalty');
          }

          // 6. upsert inventory row
          const invRow = await tx.userTool.upsert({
            where: { userId_toolId: { userId, toolId } },
            update: { quantity: { increment: 1 } },
            create: { userId, toolId, quantity: 1 },
          });

          // 7. decrement loyalty
          const updatedState = await tx.userState.update({
            where: { userId },
            data: { loyalty: { decrement: tool.price } },
          });

          return {
            ok: true,
            tool: { id: tool.id, name: tool.name, price: tool.price },
            inventory: invRow,
            state: updatedState,
          };
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (err: any) {
      const msg = String(err?.message ?? '').toLowerCase();
      if (msg.includes('could not serialize')) {
        throw new ConflictException('concurrent buy detected, retry');
      }
      throw err;
    }
  }
}
