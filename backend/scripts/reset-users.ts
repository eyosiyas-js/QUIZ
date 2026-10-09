import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find all non-admin users
  const participants = await prisma.user.findMany({
    where: { role: { not: 'ADMIN' } },
    select: { id: true }
  });
  
  const userIds = participants.map(u => u.id);

  // Delete related records
  await prisma.answer.deleteMany({ where: { session: { userId: { in: userIds } } } });
  await prisma.quizSession.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.feedback.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.lotteryWinner.deleteMany({ where: { userId: { in: userIds } } });

  // Delete users
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });

  // Create 5 new users
  const newUsers = [];
  const credentials = [];
  for (let i = 1; i <= 5; i++) {
    const email = `user${i}@example.com`;
    const phoneNumber = `+1000000000${i}`;
    const name = `Test User ${i}`;
    
    newUsers.push({
      name,
      email,
      phoneNumber,
      role: 'PARTICIPANT'
    });
    
    credentials.push({
      name,
      email,
      phone_number: phoneNumber
    });
  }

  await prisma.user.createMany({ data: newUsers });

  console.log('CREDENTIALS_JSON_START');
  console.log(JSON.stringify(credentials, null, 2));
  console.log('CREDENTIALS_JSON_END');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
