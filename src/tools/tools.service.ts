import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { clamp } from 'src/common/clamp';
import { applyStateChanges } from 'src/common/state-rules';

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

          if (!state) throw new NotFoundException('call /me first');

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
      if (err?.code === 'P2034') {
        throw new ConflictException('concurrent buy detected, retry');
      }
      throw err;
    }
  }
  async useTool(userId: string, toolId: string) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          // 1) tool exists?
          const tool = await tx.toolDefinition.findUnique({
            where: { id: toolId },
          });
          if (!tool) throw new NotFoundException('tool not found');

          // 2) user state exists?
          const state = await tx.userState.findUnique({
            where: { userId },
          });
          if (!state) throw new NotFoundException('call /me first');

          // 3) inventory row exists?
          const inv = await tx.userTool.findUnique({
            where: { userId_toolId: { userId, toolId } },
          });
          if (!inv || inv.quantity <= 0) {
            throw new ConflictException('tool not in inventory');
          }

          // 4) decrement qty (or delete if last one)
          const remainingQty = inv.quantity - 1;

          if (remainingQty === 0) {
            await tx.userTool.delete({
              where: { userId_toolId: { userId, toolId } },
            });
          } else {
            await tx.userTool.update({
              where: { userId_toolId: { userId, toolId } },
              data: { quantity: { decrement: 1 } },
            });
          }

          // 5) apply effects to state (central rules)
          const effects = (tool.effects ?? {}) as any;

          const energyDelta =
            typeof effects.energy === 'number' ? effects.energy : 0;
          const fatigueDelta =
            typeof effects.fatigue === 'number' ? effects.fatigue : 0;
          const loyaltyDelta =
            typeof effects.loyalty === 'number' ? effects.loyalty : 0;

          const { next, meta } = applyStateChanges(state, {
            energyDelta,
            fatigueDelta,
            loyaltyDelta,
          });

          const finalState = await tx.userState.update({
            where: { userId },
            data: next,
          });

          return {
            ok: true,
            used: { id: tool.id, name: tool.name },
            remainingQty,
            state: finalState,
            meta,
          };
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (err: any) {
      if (err?.code === 'P2034') {
        throw new ConflictException('concurrent use detected, retry');
      }
      throw err;
    }
  }
}
