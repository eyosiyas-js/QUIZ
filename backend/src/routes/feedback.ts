import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const feedbackSchema = z.object({
  feedback: z.object({
    stars: z.number().min(1).max(5),
    comment: z.string().optional()
  })
});

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { feedback } = feedbackSchema.parse(req.body);

    await prisma.feedback.create({
      data: {
        userId: req.user!.id,
        stars: feedback.stars,
        comment: feedback.comment
      }
    });

    res.json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
