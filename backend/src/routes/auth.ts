import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';

const phoneRegex = /^\+?[\d\s-]{8,20}$/;

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email().regex(/^[a-zA-Z0-9]/, 'Email must start with a letter or number'),
  phone_number: z.string().regex(phoneRegex, 'Phone number must be at least 8 digits (e.g. +251911223344)'),
  country: z.string().optional().nullable().transform(val => val || 'ET'),
  region: z.string().optional().nullable().transform(val => val || 'Addis Ababa'),
  city: z.string().optional().nullable().transform(val => val || 'Addis Ababa'),
});

const loginSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().regex(/^[a-zA-Z0-9]/, 'Email must start with a letter or number'),
  phone_number: z.string().min(1, 'Phone number is required'),
});

const adminLoginSchema = z.object({
  name: z.string(),
  phone_number: z.string(),
  password: z.string(),
});

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const cleanPhone = data.phone_number.replace(/[\s-]/g, '');
    const phoneWithPlus = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
    const phoneWithoutPlus = cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone;
    
    // Check if user exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { phoneNumber: cleanPhone },
          { phoneNumber: phoneWithPlus },
          { phoneNumber: phoneWithoutPlus },
        ]
      },
    });

    if (user) {
      return res.status(400).json({ message: 'User with this email or phone number already exists.' });
    }

    user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phoneNumber: cleanPhone,
        country: data.country,
        region: data.region,
        city: data.city,
        role: 'PARTICIPANT',
      },
    });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ auth_token: token });
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof z.ZodError) {
      const errorMsg = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return res.status(400).json({ message: errorMsg || 'Invalid input data', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const cleanPhone = data.phone_number.replace(/[\s-]/g, '');
    const phoneWithPlus = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
    const phoneWithoutPlus = cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone;
    
    const user = await prisma.user.findFirst({
      where: {
        email: data.email,
        OR: [
          { phoneNumber: cleanPhone },
          { phoneNumber: phoneWithPlus },
          { phoneNumber: phoneWithoutPlus },
        ]
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ auth_token: token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMsg = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return res.status(400).json({ message: errorMsg || 'Invalid input data', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/admin', async (req, res) => {
  try {
    const data = adminLoginSchema.parse(req.body);
    const cleanPhone = data.phone_number.replace(/[\s-]/g, '');
    const phoneWithPlus = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
    const phoneWithoutPlus = cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone;
    
    // In a real app, hash and compare password.
    const user = await prisma.user.findFirst({
      where: { 
        name: data.name, 
        OR: [
          { phoneNumber: cleanPhone },
          { phoneNumber: phoneWithPlus },
          { phoneNumber: phoneWithoutPlus },
        ],
        role: 'ADMIN',
        passwordHash: data.password // Just comparing plain text for simplicity in this demo, you'd use bcrypt
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ auth_token: token });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/verify', authenticateToken, (req, res) => {
  res.json({ valid: true });
});

export default router;
