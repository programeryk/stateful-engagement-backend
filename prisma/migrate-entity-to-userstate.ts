import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL missing');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  const entities = await prisma.entity.findMany({ include: { state: true } });

  let created = 0;

  for (const e of entities) {
    const s = e.state;
    if (!s) continue;

    await prisma.userState.upsert({
      where: { userId: e.userId },
      update: {
        level: s.level,
        energy: s.energy,
        loyalty: s.loyalty,
        fatigue: s.fatigue,
        streak: (s as any).streak ?? 0, // if streak exists already
      },
      create: {
        userId: e.userId,
        level: s.level,
        energy: s.energy,
        loyalty: s.loyalty,
        fatigue: s.fatigue,
        streak: (s as any).streak ?? 0,
      },
    });

    created++;
  }

  console.log(`Migrated states for ${created} entities`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());