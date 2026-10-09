import { Router } from 'express';
import { prisma } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/check/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params; // mini or grand
    const rewardType = type.toUpperCase() === 'GRAND' ? 'GRAND' : 'MINI';

    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can check lottery status' });
    }

    const thresholdSetting = await prisma.systemSetting.findUnique({ where: { key: 'eligibilityScoreThreshold' } });
    const threshold = parseInt(thresholdSetting?.value || process.env.ELIGIBILITY_SCORE_THRESHOLD || '7');

    const timeWindowSetting = await prisma.systemSetting.findUnique({ where: { key: 'lotteryTimeWindow' } });
    const timeWindowHours = parseFloat(timeWindowSetting?.value || '0');

    let sessionFilter: any = { score: { gte: threshold } };
    if (timeWindowHours > 0) {
      const windowStart = new Date();
      windowStart.setTime(windowStart.getTime() - (timeWindowHours * 60 * 60 * 1000));
      sessionFilter.createdAt = { gte: windowStart };
    }

    const eligibleUsers = await prisma.user.findMany({
      where: {
        role: 'PARTICIPANT',
        quizSessions: {
          some: sessionFilter
        }
      }
    });

    if (eligibleUsers.length === 0) {
      return res.status(400).json({ error: 'No eligible users found' });
    }

    const pastWinners = await prisma.lotteryWinner.findMany({
      where: { rewardType }
    });
    const pastWinnerIds = pastWinners.map(w => w.userId);

    const pool = eligibleUsers.filter(u => !pastWinnerIds.includes(u.id));

    if (pool.length === 0) {
      return res.status(400).json({ error: 'All eligible users have already won this lottery' });
    }

    res.json({ message: 'Ready to draw', poolSize: pool.length });
  } catch (error) {
    console.error('Lottery Check Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/draw/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params; // mini or grand
    const rewardType = type.toUpperCase() === 'GRAND' ? 'GRAND' : 'MINI';

    // Must be admin to draw (we can check role)
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can draw lotteries' });
    }

    const thresholdSetting = await prisma.systemSetting.findUnique({ where: { key: 'eligibilityScoreThreshold' } });
    const threshold = parseInt(thresholdSetting?.value || process.env.ELIGIBILITY_SCORE_THRESHOLD || '7');

    const timeWindowSetting = await prisma.systemSetting.findUnique({ where: { key: 'lotteryTimeWindow' } });
    const timeWindowHours = parseFloat(timeWindowSetting?.value || '0');

    let sessionFilter: any = { score: { gte: threshold } };
    if (timeWindowHours > 0) {
      const windowStart = new Date();
      windowStart.setTime(windowStart.getTime() - (timeWindowHours * 60 * 60 * 1000));
      sessionFilter.createdAt = { gte: windowStart };
    }

    // Find eligible users
    const eligibleUsers = await prisma.user.findMany({
      where: {
        role: 'PARTICIPANT',
        quizSessions: {
          some: sessionFilter
        }
      }
    });

    if (eligibleUsers.length === 0) {
      return res.status(400).json({ error: 'No eligible users found' });
    }

    // Filter out users who already won this type of lottery
    const pastWinners = await prisma.lotteryWinner.findMany({
      where: { rewardType }
    });
    const pastWinnerIds = pastWinners.map(w => w.userId);

    const pool = eligibleUsers.filter(u => !pastWinnerIds.includes(u.id));

    if (pool.length === 0) {
      return res.status(400).json({ error: 'All eligible users have already won this lottery' });
    }

    // Pick random winner
    const winnerIndex = Math.floor(Math.random() * pool.length);
    const winner = pool[winnerIndex];

    // Determine draw ID
    const latestDraw = await prisma.lotteryWinner.findFirst({
      where: { rewardType },
      orderBy: { drawId: 'desc' }
    });
    const newDrawId = latestDraw ? latestDraw.drawId + 1 : 1;

    // Save winner
    await prisma.lotteryWinner.create({
      data: {
        drawId: newDrawId,
        userId: winner.id,
        rewardType
      }
    });

    res.json({
      winner: winner.name,
      phone_number: winner.phoneNumber,
      email: winner.email
    });

  } catch (error) {
    console.error('Lottery Draw Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
