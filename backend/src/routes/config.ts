import { Router } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// ============================================================
// DEFAULT CONFIGURATION
// ============================================================
const DEFAULT_CONFIG = {
  branding: {
    eventName: "6th Cyber Month Contest",
    organizationName: "INSA",
    logoUrl: "/logo.png",
    faviconUrl: "/favicon.ico",
    metaTitle: "3D Quiz App",
    metaDescription: "Interactive 3D quiz application with animations"
  },
  theme: {
    primaryGradientFrom: "#0b1236",
    primaryGradientVia: "#0f1a4a",
    primaryGradientTo: "#091029",
    accentColor: "#06b6d4",
    buttonGradientFrom: "#0284c7",
    buttonGradientTo: "#2563eb",
    selectedAnswerColor: "#9333ea",
    overlayOpacity: 0.6,
    fontFamily: "Inter"
  },
  media: {
    backgroundVideoUrl: "/cyber.mp4",
    backgroundImageUrl: "",
    backgroundType: "video",
    qrCodeUrl: "/qr.png"
  },
  pages: {
    login: {
      title: "Welcome to 6th Cyber Month Contest",
      subtitle: "Enter your details to join the contest",
      submitButtonText: "Sign In",
      submittingText: "Signing In...",
      signupLinkText: "Don't have an account?",
      signupLinkLabel: "Sign up here"
    },
    signup: {
      title: "Create Your Account",
      subtitle: "Sign up to join the tech quiz contest",
      submitButtonText: "Create Account",
      submittingText: "Creating Account...",
      loginLinkText: "Already have an account?",
      loginLinkLabel: "Sign in here",
      defaultCountry: "ET"
    },
    contest: {
      successTitle: "Registration Successful!",
      successMessage: "Congratulations {name}, you're now entered in our contest!",
      phoneConfirmText: "Your entry has been confirmed with phone number:",
      viewWinnersText: "View Winners",
      viewLotteryText: "View Lottery Drawing",
      quizSectionTitle: "Cyber Security Quiz Challenge",
      quizSectionSubtitle: "Take our Cyber Security Quiz to win Prizes in the contest!",
      quizInfoTitle: "Cyber Security Quiz Challenge",
      quizInfoSubtitle: "10 questions • ~10 minutes",
      quizCompletionBonus: "+3 extra Prizes for completion!",
      startQuizText: "Start Quiz",
      tryNextRoundText: "Try Next Round",
      quizCompletedText: "Quiz Completed"
    },
    quiz: {
      nextButtonText: "Next Question",
      finishButtonText: "Finish Quiz",
      loadingText: "Loading quiz...",
      timerDuration: 60
    },
    celebration: {
      perfectTitle: "Perfect Score!",
      perfectMessage: "Incredible! You've earned maximum contest entries!",
      highTitle: "Excellent Work!",
      highMessage: "Great job on completing the quiz!",
      mediumTitle: "Quiz Complete!",
      mediumMessage: "Good effort on the quiz!",
      lowTitle: "Quiz Complete",
      lowMessage: "You've completed the quiz. Keep practicing!",
      redirectText: "Showing results in",
      redirectDelay: 3
    },
    results: {
      summaryTabLabel: "Summary",
      detailsTabLabel: "Question Details",
      scoreTitle: "Your Score",
      backButtonText: "Back",
      messages: {
        perfect: "Perfect score! You've earned maximum contest entries!",
        excellent: "Excellent! Nearly perfect score!",
        great: "Great job! You did well!",
        good: "Good effort! Keep practicing!",
        low: "Keep trying! You'll do better next time!"
      }
    },
    lottery: {
      title: "Grand Lottery Prize",
      subtitle: "Countdown starts after clicking the button",
      startButtonText: "Start Lottery",
      drawingTitle: "Lottery Drawing",
      drawingSubtitle: "The winning phone number will be revealed!",
      congratsTitle: "🎉 Congratulations!",
      congratsMessage: "You are the lucky winner of this draw",
      claimMessage: "🎁 You can claim your prize shortly. Our team will contact you with the next steps.",
      countdownDuration: 30
    },
    rating: {
      title: "Rate Your Experience",
      subtitle: "We'd love to hear your feedback",
      submitButtonText: "Submit Rating",
      skipText: "Skip for now"
    },
    dashboard: {
      heroTitle: "Scan the QR to win Prizes",
      statsTitle: "Participants Stats",
      eligibleTitle: "Eligible Participants",
      totalTitle: "Total Contestants",
      countdownTitle: "Time Remaining For The Next Award"
    }
  },
  prizes: [
    {
      name: "INSA Laptop",
      description: "High-performance laptop for winners",
      image: "/prize-laptop.jpg",
      rank: "1st"
    },
    {
      name: "Redmi Watch 2",
      description: "Latest smartwatch with health tracking",
      image: "/prize-smartwatch.jpg",
      rank: "2nd"
    },
    {
      name: "500 ETB card",
      description: "A 500 ETB ethiotelecom mobile card",
      image: "/tele.png",
      rank: "3rd"
    }
  ],
  sections: {
    showLogo: true,
    showBackgroundVideo: true,
    showPrizes: true,
    showLottery: true,
    showDashboard: true,
    showQrCode: true,
    showRatingModal: true
  }
};

// ============================================================
// PUBLIC: Get site configuration (no auth required)
// ============================================================
router.get('/', async (req, res) => {
  try {
    const siteConfig = await prisma.siteConfig.findUnique({ where: { id: 1 } });

    if (!siteConfig) {
      // Return default config if none exists yet
      return res.json(DEFAULT_CONFIG);
    }

    res.json(JSON.parse(siteConfig.config));
  } catch (error) {
    console.error('Failed to fetch site config:', error);
    res.status(500).json({ error: 'Failed to fetch site configuration' });
  }
});

// ============================================================
// ADMIN: Get site configuration for editing
// ============================================================
const requireAdmin = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.get('/admin', authenticateToken as any, requireAdmin as any, async (req, res) => {
  try {
    const siteConfig = await prisma.siteConfig.findUnique({ where: { id: 1 } });

    if (!siteConfig) {
      return res.json(DEFAULT_CONFIG);
    }

    res.json(JSON.parse(siteConfig.config));
  } catch (error) {
    console.error('Failed to fetch site config:', error);
    res.status(500).json({ error: 'Failed to fetch site configuration' });
  }
});

// ============================================================
// ADMIN: Update site configuration
// ============================================================
router.put('/admin', authenticateToken as any, requireAdmin as any, async (req, res) => {
  try {
    const { config } = req.body;

    if (!config || typeof config !== 'object') {
      return res.status(400).json({ error: 'Invalid configuration object' });
    }

    // Merge with defaults to ensure all keys exist
    const mergedConfig = deepMerge(DEFAULT_CONFIG, config);

    await prisma.siteConfig.upsert({
      where: { id: 1 },
      update: { config: JSON.stringify(mergedConfig) },
      create: { id: 1, config: JSON.stringify(mergedConfig) }
    });

    res.json({ message: 'Site configuration updated successfully', config: mergedConfig });
  } catch (error) {
    console.error('Failed to update site config:', error);
    res.status(500).json({ error: 'Failed to update site configuration' });
  }
});

// ============================================================
// ADMIN: Reset to default configuration
// ============================================================
router.post('/admin/reset', authenticateToken as any, requireAdmin as any, async (req, res) => {
  try {
    await prisma.siteConfig.upsert({
      where: { id: 1 },
      update: { config: JSON.stringify(DEFAULT_CONFIG) },
      create: { id: 1, config: JSON.stringify(DEFAULT_CONFIG) }
    });

    res.json({ message: 'Configuration reset to defaults', config: DEFAULT_CONFIG });
  } catch (error) {
    console.error('Failed to reset site config:', error);
    res.status(500).json({ error: 'Failed to reset site configuration' });
  }
});

// ============================================================
// Helper: Deep merge objects
// ============================================================
function deepMerge(target: any, source: any): any {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

export default router;
export { DEFAULT_CONFIG };
