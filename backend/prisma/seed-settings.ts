import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.systemSetting.upsert({
    where: { key: 'allowMultipleQuizAttempts' },
    update: {},
    create: {
      key: 'allowMultipleQuizAttempts',
      value: 'true',
    }
  });
  console.log('Default setting seeded.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
