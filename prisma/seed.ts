import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is missing');

const adapter = new PrismaPg({ connectionString: url! });
const prisma = new PrismaClient({ adapter });
async function main() {
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

  for (const reward of rewards) {
    await prisma.reward.upsert({
      where: { id: reward.id },
      update: {},
      create: reward,
    });
  }

  console.log(`reward seeded!`);
}

main()
  .catch((e) => {
    console.log(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
