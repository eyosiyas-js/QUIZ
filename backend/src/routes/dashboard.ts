import { Router } from 'express';
import { prisma } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/eligible_count', authenticateToken, async (req, res) => {
  try {
    // To be eligible, a user must have at least one quiz session with a passing score.
    // We'll configure "passing score" as env var or default to 7. 
    // Assuming 10 questions total.
    const thresholdSetting = await prisma.systemSetting.findUnique({ where: { key: 'eligibilityScoreThreshold' } });
    const threshold = parseInt(thresholdSetting?.value || process.env.ELIGIBILITY_SCORE_THRESHOLD || '7');

    const eligibleUsers = await prisma.user.count({
      where: {
        role: 'PARTICIPANT',
        quizSessions: {
          some: {
            score: {
              gte: threshold
            }
          }
        }
      }
    });

    const totalUsers = await prisma.user.count({
      where: { role: 'PARTICIPANT' }
    });

    res.json({
      eligible_users_count: eligibleUsers,
      outof: totalUsers
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/mini_lottery_rewards', authenticateToken, async (req, res) => {
  try {
    const rewards = await prisma.reward.findMany({
      where: { type: 'MINI' }
    });
    const formatted = rewards.map(r => ({
      name: r.name,
      image_url: r.imageUrl
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/grand_lottery_rewards', authenticateToken, async (req, res) => {
  try {
    const rewards = await prisma.reward.findMany({
      where: { type: 'GRAND' }
    });
    const formatted = rewards.map(r => ({
      name: r.name,
      image_url: r.imageUrl
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/mini_lottery_winners', authenticateToken, async (req, res) => {
  try {
    const winners = await prisma.lotteryWinner.findMany({
      where: { rewardType: 'MINI' },
      include: { user: true },
      orderBy: { drawTime: 'desc' }
    });

    const formatted = winners.map(w => ({
      draw_id: w.drawId,
      draw_time: w.drawTime,
      winner_name: w.user.name,
      phone_number: w.user.phoneNumber
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/participation-stats', async (req, res) => {
  try {
    const thresholdSetting = await prisma.systemSetting.findUnique({ where: { key: 'eligibilityScoreThreshold' } });
    const threshold = parseInt(thresholdSetting?.value || process.env.ELIGIBILITY_SCORE_THRESHOLD || '7');

    const [
      totalParticipants,
      totalSessions,
      completedSessions,
      totalWinners,
      totalAnswers,
      correctAnswers,
      questions,
      answersGrouped,
      sessions
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'PARTICIPANT' } }),
      prisma.quizSession.count(),
      prisma.quizSession.count({ where: { total: { gt: 0 } } }),
      prisma.lotteryWinner.count(),
      prisma.answer.count(),
      prisma.answer.count({ where: { isCorrect: true } }),
      prisma.question.findMany({ select: { id: true, questionText: true, isActive: true }, orderBy: { id: 'asc' } }),
      prisma.answer.groupBy({
        by: ['questionId', 'isCorrect'],
        _count: { id: true },
      }),
      prisma.quizSession.findMany({
        where: { total: { gt: 0 } },
        select: { score: true, total: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const eligibleUsers = await prisma.user.count({
      where: {
        role: 'PARTICIPANT',
        quizSessions: {
          some: {
            score: { gte: threshold }
          }
        }
      }
    });

    // Score distribution (0 through 10)
    const scoreDistribution: Record<number, number> = {};
    for (let i = 0; i <= 10; i++) scoreDistribution[i] = 0;
    sessions.forEach(s => {
      const sc = Math.min(Math.max(s.score, 0), 10);
      scoreDistribution[sc] = (scoreDistribution[sc] || 0) + 1;
    });

    // Per question accuracy stats
    const questionStats = questions.map(q => {
      const correctItem = answersGrouped.find(a => a.questionId === q.id && a.isCorrect === true);
      const incorrectItem = answersGrouped.find(a => a.questionId === q.id && a.isCorrect === false);
      const correct = correctItem ? correctItem._count.id : 0;
      const incorrect = incorrectItem ? incorrectItem._count.id : 0;
      const total = correct + incorrect;
      const accuracyRate = total > 0 ? Math.round((correct / total) * 100) : 0;
      return {
        id: q.id,
        question: q.questionText,
        isActive: q.isActive,
        totalAnswers: total,
        correctAnswers: correct,
        incorrectAnswers: incorrect,
        accuracyRate,
      };
    });

    // Recent 7 days trend
    const dailyActivity: Record<string, { date: string; attempts: number; eligible: number }> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyActivity[key] = { date: key, attempts: 0, eligible: 0 };
    }

    sessions.forEach(s => {
      const key = s.createdAt.toISOString().split('T')[0];
      if (dailyActivity[key]) {
        dailyActivity[key].attempts += 1;
        if (s.score >= threshold) dailyActivity[key].eligible += 1;
      }
    });

    const averageScore = sessions.length > 0
      ? parseFloat((sessions.reduce((acc, s) => acc + s.score, 0) / sessions.length).toFixed(1))
      : 0;

    const overallAccuracyRate = totalAnswers > 0
      ? parseFloat(((correctAnswers / totalAnswers) * 100).toFixed(1))
      : 0;

    const eligibilityRate = totalParticipants > 0
      ? parseFloat(((eligibleUsers / totalParticipants) * 100).toFixed(1))
      : 0;

    res.json({
      summary: {
        totalParticipants,
        totalSessions,
        completedSessions,
        eligibleUsers,
        eligibilityRate,
        threshold,
        averageScore,
        totalAnswers,
        correctAnswers,
        incorrectAnswers: totalAnswers - correctAnswers,
        overallAccuracyRate,
        totalWinners,
      },
      scoreDistribution,
      questionStats,
      dailyTrend: Object.values(dailyActivity),
    });
  } catch (error) {
    console.error('Participation Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch participation statistics' });
  }
});

export default router;

