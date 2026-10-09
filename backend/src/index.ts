import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import quizRoutes from './routes/quiz';
import dashboardRoutes from './routes/dashboard';
import lotteryRoutes from './routes/lottery';
import feedbackRoutes from './routes/feedback';
import adminRoutes from './routes/admin';
import configRoutes from './routes/config';
import uploadRoutes from './routes/upload';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically with security headers
app.use('/uploads', (req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; script-src 'none'; style-src 'unsafe-inline'; object-src 'none'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/lottery', lotteryRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/config', configRoutes);
app.use('/api/admin/upload', uploadRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

