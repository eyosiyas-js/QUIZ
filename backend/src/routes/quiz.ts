import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get questions
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    
    const existingSession = await prisma.quizSession.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (existingSession) {
      const allowMultipleSetting = await prisma.systemSetting.findUnique({
        where: { key: 'allowMultipleQuizAttempts' }
      });
      
      if (allowMultipleSetting?.value === 'false') {
        return res.status(400).json({ error: 'Re-entry is not allowed at the moment.' });
      } else {
        const cooldownSetting = await prisma.systemSetting.findUnique({
          where: { key: 'quizCooldownHours' }
        });
        const cooldownHours = parseFloat(cooldownSetting?.value || '0');
        if (cooldownHours > 0) {
          const now = new Date();
          const lastAttempt = existingSession.createdAt;
          const hoursSinceLastAttempt = (now.getTime() - lastAttempt.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastAttempt < cooldownHours) {
            const hoursLeft = cooldownHours - hoursSinceLastAttempt;
            let waitMessage = '';
            if (hoursLeft >= 24) {
              waitMessage = `${(hoursLeft / 24).toFixed(1)} day(s)`;
            } else if (hoursLeft >= 1) {
              waitMessage = `${Math.ceil(hoursLeft)} hour(s)`;
            } else {
              waitMessage = `${Math.ceil(hoursLeft * 60)} minute(s)`;
            }
            return res.status(400).json({ error: `You must wait ${waitMessage} before attempting the quiz again.` });
          }
        }
      }
    }

    const numQuestionsSetting = await prisma.systemSetting.findUnique({
      where: { key: 'numberOfQuestionsPerQuiz' }
    });
    const numQuestions = parseInt(numQuestionsSetting?.value || '10');

    let questions = await prisma.question.findMany({
      where: { isActive: true },
      // Select only what the user needs, not the correct answer
      select: {
        id: true,
        questionText: true,
        options: true,
      }
    });

    // Randomize and limit questions
    questions = questions.sort(() => 0.5 - Math.random()).slice(0, numQuestions);

    // Format options from JSON string back to array and shuffle options
    const formattedQuestions = questions.map(q => {
      const parsedOptions = JSON.parse(q.options) as string[];
      const shuffledOptions = parsedOptions.sort(() => 0.5 - Math.random());
      return {
        id: q.id,
        question: q.questionText,
        options: shuffledOptions
      };
    });

    await prisma.quizSession.create({
      data: {
        userId,
        score: 0,
        total: -1
      }
    });

    res.json(formattedQuestions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

const submitQuizSchema = z.object({
  answers: z.array(z.object({
    question_id: z.number(),
    selected_answer: z.string().nullable()
  }))
});

// Submit answers
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    
    const existingSession = await prisma.quizSession.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (existingSession && existingSession.total !== -1) {
      const allowMultipleSetting = await prisma.systemSetting.findUnique({
        where: { key: 'allowMultipleQuizAttempts' }
      });
      
      if (allowMultipleSetting?.value === 'false') {
        return res.status(400).json({ error: 'Re-entry is not allowed at the moment.' });
      } else {
        const cooldownSetting = await prisma.systemSetting.findUnique({
          where: { key: 'quizCooldownHours' }
        });
        const cooldownHours = parseFloat(cooldownSetting?.value || '0');
        if (cooldownHours > 0) {
          const now = new Date();
          const lastAttempt = existingSession.createdAt;
          const hoursSinceLastAttempt = (now.getTime() - lastAttempt.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastAttempt < cooldownHours) {
            const hoursLeft = cooldownHours - hoursSinceLastAttempt;
            let waitMessage = '';
            if (hoursLeft >= 24) {
              waitMessage = `${(hoursLeft / 24).toFixed(1)} day(s)`;
            } else if (hoursLeft >= 1) {
              waitMessage = `${Math.ceil(hoursLeft)} hour(s)`;
            } else {
              waitMessage = `${Math.ceil(hoursLeft * 60)} minute(s)`;
            }
            return res.status(400).json({ error: `You must wait ${waitMessage} before attempting the quiz again.` });
          }
        }
      }
    }

    const { answers } = submitQuizSchema.parse(req.body);

    const answeredQuestionIds = answers.map(a => a.question_id);

    const questions = await prisma.question.findMany({
      where: { id: { in: answeredQuestionIds } }
    });

    let score = 0;
    const total = answers.length; // Calculate total based on number of questions received
    const corrections: any[] = [];
    const answerRecords: any[] = [];

    for (const q of questions) {
      const userAnswer = answers.find(a => a.question_id === q.id);
      const userSelected = userAnswer?.selected_answer || "";
      const isCorrect = userSelected === q.correctAnswer;

      if (isCorrect) {
        score++;
      }

      corrections.push({
        question_id: q.id,
        the_question: q.questionText,
        answer: userSelected,
        correct_answer: q.correctAnswer,
        correct: isCorrect
      });

      answerRecords.push({
        questionId: q.id,
        userAnswer: userSelected,
        isCorrect
      });
    }

    // Save session
    if (existingSession && existingSession.total === -1) {
      await prisma.quizSession.update({
        where: { id: existingSession.id },
        data: {
          score,
          total,
          answers: {
            create: answerRecords
          }
        }
      });
    } else {
      await prisma.quizSession.create({
        data: {
          userId,
          score,
          total,
          answers: {
            create: answerRecords
          }
        }
      });
    }

    res.json({
      score: `${score}/${total}`,
      corrections
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

export default router;
