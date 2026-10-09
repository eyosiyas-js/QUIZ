import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clean() {
  // Find all test users
  const testUsers = await prisma.user.findMany({
    where: {
      name: {
        startsWith: 'Test User'
      }
    }
  });

  const ids = testUsers.map(u => u.id);

  // Delete answers associated with their quiz sessions
  await prisma.answer.deleteMany({
    where: {
      session: {
        userId: { in: ids }
      }
    }
  });

  // Delete their quiz sessions
  await prisma.quizSession.deleteMany({
    where: {
      userId: { in: ids }
    }
  });

  // Delete their lottery wins
  await prisma.lotteryWinner.deleteMany({
    where: {
      userId: { in: ids }
    }
  });

  // Delete their feedback
  await prisma.feedback.deleteMany({
    where: {
      userId: { in: ids }
    }
  });

  // Delete the users
  await prisma.user.deleteMany({
    where: {
      id: { in: ids }
    }
  });

  console.log('Removed all test participants.');
}

clean().finally(() => prisma.$disconnect());
