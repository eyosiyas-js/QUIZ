import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@insa.gov.et' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@insa.gov.et',
      phoneNumber: '+251911111111',
      role: 'ADMIN',
      passwordHash: 'admin123' // Simple plain text for demo
    }
  });
  console.log('Admin created:', admin.email);

  // 2. Create Questions
  const questionsData = [
    {
      questionText: 'What does INSA stand for?',
      options: JSON.stringify(['Information Network Security Agency', 'International Network Security Association', 'Information National Security Agency', 'Internal Network Security Agency']),
      correctAnswer: 'Information Network Security Agency'
    },
    {
      questionText: 'What is the most common type of cyber attack?',
      options: JSON.stringify(['Phishing', 'DDoS', 'Malware', 'SQL Injection']),
      correctAnswer: 'Phishing'
    },
    {
      questionText: 'Which protocol is used for secure communication over a computer network?',
      options: JSON.stringify(['HTTP', 'FTP', 'HTTPS', 'SMTP']),
      correctAnswer: 'HTTPS'
    },
    {
      questionText: 'What is a strong password?',
      options: JSON.stringify(['123456', 'password', 'Admin123!', 'A combination of letters, numbers, and symbols']),
      correctAnswer: 'A combination of letters, numbers, and symbols'
    },
    {
      questionText: 'What should you do if you receive a suspicious email?',
      options: JSON.stringify(['Click the link to investigate', 'Reply asking who they are', 'Delete it and do not click any links', 'Forward it to friends']),
      correctAnswer: 'Delete it and do not click any links'
    }
  ];

  for (const q of questionsData) {
    await prisma.question.create({ data: q });
  }
  console.log('Questions seeded.');

  // 3. Create Rewards
  const rewardsData = [
    { name: 'Redmi Watch 4', imageUrl: 'https://shandaarbuy.pk/cdn/shop/files/Redmi_Watch_4_Xiaomi_Global_Smart_Watch.jpg?v=1724945719', type: 'MINI' },
    { name: 'Wireless Headphones', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', type: 'MINI' },
    { name: 'MacBook Pro', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', type: 'GRAND' }
  ];

  for (const r of rewardsData) {
    await prisma.reward.create({ data: r });
  }
  console.log('Rewards seeded.');

  // 4. Create some participants for testing
  for(let i=1; i<=10; i++) {
    const user = await prisma.user.create({
      data: {
        name: `Test User ${i}`,
        email: `test${i}@example.com`,
        phoneNumber: `+25191100000${i}`,
        role: 'PARTICIPANT'
      }
    });

    // Give them a quiz session
    await prisma.quizSession.create({
      data: {
        userId: user.id,
        score: i > 5 ? 10 : 5, // Users 6-10 pass
        total: 10
      }
    });
  }
  console.log('Test participants seeded.');

  console.log('Database seeding complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
