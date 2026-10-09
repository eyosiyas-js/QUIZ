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

export default router;
