import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Middleware: Ensure all routes require ADMIN role
const requireAdmin = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.use(authenticateToken as any);
router.use(requireAdmin as any);

// ============================================================
// SETTINGS
// ============================================================
router.get('/settings', async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    // Convert to a simple key-value object
    const settingsObj: Record<string, string> = {};
    settings.forEach(s => { settingsObj[s.key] = s.value; });
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings object' });
    }
    
    // Update or create each setting
    for (const [key, value] of Object.entries(settings)) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });
    }
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ============================================================
// STATS — Aggregate counts for dashboard overview
// ============================================================
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalQuestions, totalSessions, totalFeedback, totalWinners] = await Promise.all([
      prisma.user.count({ where: { role: 'PARTICIPANT' } }),
      prisma.question.count(),
      prisma.quizSession.count(),
      prisma.feedback.count(),
      prisma.lotteryWinner.count(),
    ]);

    const avgScore = await prisma.quizSession.aggregate({
      _avg: { score: true },
    });

    const avgFeedback = await prisma.feedback.aggregate({
      _avg: { stars: true },
    });

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

    const eligibleUsers = await prisma.user.count({
      where: {
        role: 'PARTICIPANT',
        quizSessions: { some: sessionFilter },
      },
    });

    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentRegistrations = await prisma.user.count({
      where: {
        role: 'PARTICIPANT',
        createdAt: { gte: sevenDaysAgo },
      },
    });

    res.json({
      totalUsers,
      totalQuestions,
      totalSessions,
      totalFeedback,
      totalWinners,
      eligibleUsers,
      recentRegistrations,
      averageScore: avgScore._avg.score || 0,
      averageFeedbackRating: avgFeedback._avg.stars || 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ============================================================
// USERS
// ============================================================
router.get('/users', async (req, res) => {
  try {
    const { search, role } = req.query;
    const where: any = {};
    if (role && typeof role === 'string') {
      where.role = role;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phoneNumber: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        _count: {
          select: { quizSessions: true, feedbacks: true, lotteryWins: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        quizSessions: { include: { answers: true }, orderBy: { createdAt: 'desc' } },
        feedbacks: { orderBy: { createdAt: 'desc' } },
        lotteryWins: { orderBy: { drawTime: 'desc' } },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    // Delete related records first
    const userId = req.params.id;
    await prisma.answer.deleteMany({ where: { session: { userId } } });
    await prisma.quizSession.deleteMany({ where: { userId } });
    await prisma.feedback.deleteMany({ where: { userId } });
    await prisma.lotteryWinner.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ============================================================
// QUESTIONS
// ============================================================
router.get('/questions', async (req, res) => {
  try {
    const questions = await prisma.question.findMany({
      orderBy: { id: 'asc' },
    });
    const formatted = questions.map((q) => ({
      ...q,
      options: JSON.parse(q.options),
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

const questionSchema = z.object({
  questionText: z.string().min(1),
  options: z.array(z.string()).min(2),
  correctAnswer: z.string().min(1),
  isActive: z.boolean().optional(),
});

const bulkQuestionSchema = z.array(questionSchema);

router.post('/questions/bulk', async (req, res) => {
  try {
    const questions = bulkQuestionSchema.parse(req.body);
    const createData = questions.map(q => ({
      questionText: q.questionText,
      options: JSON.stringify(q.options),
      correctAnswer: q.correctAnswer,
      isActive: q.isActive ?? true,
    }));
    await prisma.question.createMany({
      data: createData,
    });
    res.json({ message: `${questions.length} questions imported successfully` });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid JSON format', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to import questions' });
  }
});

router.post('/questions', async (req, res) => {
  try {
    const data = questionSchema.parse(req.body);
    const question = await prisma.question.create({
      data: {
        questionText: data.questionText,
        options: JSON.stringify(data.options),
        correctAnswer: data.correctAnswer,
        isActive: data.isActive ?? true,
      },
    });
    res.json({ ...question, options: JSON.parse(question.options) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create question' });
  }
});

router.put('/questions/:id', async (req, res) => {
  try {
    const data = questionSchema.parse(req.body);
    const question = await prisma.question.update({
      where: { id: parseInt(req.params.id) },
      data: {
        questionText: data.questionText,
        options: JSON.stringify(data.options),
        correctAnswer: data.correctAnswer,
        isActive: data.isActive,
      },
    });
    res.json({ ...question, options: JSON.parse(question.options) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update question' });
  }
});

router.delete('/questions/:id', async (req, res) => {
  try {
    // Delete related answers first
    await prisma.answer.deleteMany({ where: { questionId: parseInt(req.params.id) } });
    await prisma.question.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// ============================================================
// QUIZ SESSIONS
// ============================================================
router.get('/quiz-sessions', async (req, res) => {
  try {
    const sessions = await prisma.quizSession.findMany({
      include: {
        user: { select: { name: true, email: true, phoneNumber: true } },
        answers: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quiz sessions' });
  }
});

// ============================================================
// REWARDS
// ============================================================
router.get('/rewards', async (req, res) => {
  try {
    const rewards = await prisma.reward.findMany({ orderBy: { id: 'asc' } });
    res.json(rewards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});

const rewardSchema = z.object({
  name: z.string().min(1),
  imageUrl: z.string().min(1),
  type: z.enum(['MINI', 'GRAND']),
});

router.post('/rewards', async (req, res) => {
  try {
    const data = rewardSchema.parse(req.body);
    const reward = await prisma.reward.create({ data });
    res.json(reward);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create reward' });
  }
});

router.put('/rewards/:id', async (req, res) => {
  try {
    const data = rewardSchema.parse(req.body);
    const reward = await prisma.reward.update({
      where: { id: parseInt(req.params.id) },
      data,
    });
    res.json(reward);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update reward' });
  }
});

router.delete('/rewards/:id', async (req, res) => {
  try {
    await prisma.reward.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Reward deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete reward' });
  }
});

// ============================================================
// LOTTERY WINNERS
// ============================================================
router.get('/lottery-winners', async (req, res) => {
  try {
    const winners = await prisma.lotteryWinner.findMany({
      include: {
        user: { select: { name: true, email: true, phoneNumber: true } },
      },
      orderBy: { drawTime: 'desc' },
    });
    res.json(winners);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lottery winners' });
  }
});

// ============================================================
// FEEDBACK
// ============================================================
router.get('/feedback', async (req, res) => {
  try {
    const feedback = await prisma.feedback.findMany({
      include: {
        user: { select: { name: true, email: true, phoneNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

router.delete('/feedback/:id', async (req, res) => {
  try {
    await prisma.feedback.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
});

export default router;
