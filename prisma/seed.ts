import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is missing');

const adapter = new PrismaPg({ connectionString: url! });
const prisma = new PrismaClient({ adapter });
async function main() {
  const demoUserId = '11111111-1111-1111-1111-111111111111';
  const rewards = [
    {
      id: 'streak_3',
      title: '3 Day streak',
      description: 'Reward for checking in 3 days in a row',
      type: 'streak',
      threshold: 3,
    },
    {
      id: 'streak_7',
      title: '7 Day streak',
      description: 'Reward for checking in 7 days in a row',
      type: 'streak',
      threshold: 7,
    },
  ];

  const tools = [
    {
      id: 'coffee',
      name: 'Coffee',
      description: 'Boosts energy a bit',
      price: 10,
      effects: { energy: 15, fatigue: 2 },
    },
    {
      id: 'rest',
      name: 'Rest Kit',
      description: 'Reduces fatigue',
      price: 16,
      effects: { fatigue: -15 },
    },
    {
      id: 'focus',
      name: 'Focus Chip',
      description: 'Small loyalty bonus',
      price: 20,
      effects: { loyalty: 5, energy: 5 },
    },
  ];

  for (const reward of rewards) {
    await prisma.reward.upsert({
      where: { id: reward.id },
      update: {},
      create: reward,
    });
  }

  for (const tool of tools) {
    await prisma.toolDefinition.upsert({
      where: { id: tool.id },
      update: { ...tool },
      create: { ...tool },
    });
  }
  //seeding this only before /buy is implemented
  // await prisma.userTool.upsert({
  //   where: { userId_toolId: { userId: demoUserId, toolId: 'coffee' } },
  //   update: { quantity: { increment: 2 } },
  //   create: { userId: demoUserId, toolId: 'coffee', quantity: 2 },
  // });

  console.log(`seeded all the tables!`);
}

main()
  .catch((e) => {
    console.log(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
