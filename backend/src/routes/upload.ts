import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sanitizeHtml from 'sanitize-html';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter — allow images and videos
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
});

// Middleware: Ensure admin role
const requireAdmin = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ============================================================
// ADMIN: Upload a file
// ============================================================
router.post(
  '/',
  authenticateToken as any,
  requireAdmin as any,
  upload.single('file'),
  (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Sanitize SVG files
      if (req.file.mimetype === 'image/svg+xml') {
        const filePath = path.join(uploadsDir, req.file.filename);
        const svgContent = fs.readFileSync(filePath, 'utf8');
        const cleanSvg = sanitizeHtml(svgContent, {
          allowedTags: [ 'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'defs', 'linearGradient', 'stop', 'g', 'title', 'desc' ],
          allowedAttributes: {
            '*': ['viewBox', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'd', 'cx', 'cy', 'r', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'points', 'id', 'class', 'style', 'xmlns', 'transform', 'opacity']
          }
        });
        fs.writeFileSync(filePath, cleanSvg);
      }

      const fileUrl = `/uploads/${req.file.filename}`;

      res.json({
        message: 'File uploaded successfully',
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  }
);

// ============================================================
// ADMIN: Delete an uploaded file
// ============================================================
router.delete('/:filename', authenticateToken as any, requireAdmin as any, (req: any, res: any) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    fs.unlinkSync(filePath);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('File delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
