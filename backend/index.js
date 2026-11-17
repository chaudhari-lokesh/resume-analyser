const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const multer = require('multer');

const logger = require('./logger');
const { parseResume } = require('./parser');
const { queryAI } = require('./ai');
const {
  detectFileTypeFromMagicBytes,
  getCorsOrigins,
  isOriginAllowed,
  generalLimiter,
  analyzeLimiter,
} = require('./security');

const app = express();
const port = process.env.PORT || 5000;

// Trust reverse proxy (Render, Cloudflare, etc.)
app.set('trust proxy', 1);

// Security headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", 'https://*.onrender.com', ...getCorsOrigins()],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

// Response compression
app.use(compression());

// Request correlation ID and request logging
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// Serve frontend static assets before strict CORS and API limiters
const distPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(
    express.static(distPath, {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        // Cache hashed Vite build assets immutably
        if (filePath.includes(path.sep + 'assets' + path.sep) || filePath.includes('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })
  );
}

// Robust CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // If origin is allowed, pass true; if not, pass false (never pass an Error to avoid 500)
    if (isOriginAllowed(origin, null)) {
      callback(null, true);
    } else {
      logger.warn({ msg: 'CORS disallowed request', origin });
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  credentials: true,
  maxAge: 86400,
};
app.use(cors(corsOptions));

// Body parsing with safe size limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply general rate limiter across incoming traffic
app.use(generalLimiter);

// Configure Multer for memory-only storage (5MB maximum)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/octet-stream', // sometimes reported by Windows for docx/pdf
    ];
    const allowedExtensions = ['.pdf', '.docx'];
    const ext = '.' + file.originalname.split('.').pop().toLowerCase();

    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      const err = new Error('Invalid file type. Only PDF and DOCX files are allowed.');
      err.status = 415;
      err.code = 'UNSUPPORTED_FILE_TYPE';
      cb(err);
    }
  },
});

/**
 * GET /health
 * Lightweight liveness probe.
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /ready
 * Readiness probe: verifies environment and AI provider configuration.
 */
app.get('/ready', (req, res) => {
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  let hasKey = false;

  switch (provider) {
    case 'gemini':
      hasKey = Boolean(process.env.GEMINI_API_KEY);
      break;
    case 'openai':
      hasKey = Boolean(process.env.OPENAI_API_KEY);
      break;
    case 'claude':
      hasKey = Boolean(process.env.CLAUDE_API_KEY);
      break;
    case 'openrouter':
      hasKey = Boolean(process.env.OPENROUTER_API_KEY);
      break;
    case 'grok':
      hasKey = Boolean(process.env.GROK_API_KEY);
      break;
    case 'ml':
      hasKey = true;
      break;
    default:
      hasKey = false;
  }

  if (!hasKey) {
    return res.status(503).json({
      status: 'unready',
      provider,
      error: `API key for provider '${provider}' is not configured in environment.`,
    });
  }

  res.status(200).json({
    status: 'ready',
    provider,
    port: Number(port),
  });
});

/**
 * POST /analyze
 * Uploads a resume file, extracts text in memory, and returns validated AI evaluation.
 */
app.post('/analyze', analyzeLimiter, upload.single('resume'), async (req, res, next) => {
  let fileBuffer = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Please upload a PDF or DOCX resume document.',
        code: 'MISSING_FILE',
      });
    }

    fileBuffer = req.file.buffer;
    const { mimetype, originalname, size } = req.file;

    logger.info({
      msg: 'Resume upload received',
      requestId: req.id,
      fileSize: size,
      mimetype,
    });

    // Extract text in memory
    const extractedText = await parseResume(fileBuffer, mimetype, originalname);

    // Explicitly dereference and wipe the buffer from memory
    req.file.buffer = null;
    fileBuffer = null;

    // Send text to configured AI provider
    const analysisResult = await queryAI(extractedText);

    logger.info({
      msg: 'Resume analysis completed successfully',
      requestId: req.id,
      overallScore: analysisResult.overall_score,
    });

    return res.status(200).json(analysisResult);
  } catch (error) {
    // Explicit buffer cleanup in case of error
    if (req.file) req.file.buffer = null;
    fileBuffer = null;

    next(error);
  }
});

/**
 * Fallback to serve the React frontend index.html for client routing in production.
 */
app.get('*', (req, res, next) => {
  // Ignore API paths
  if (req.path.startsWith('/analyze') || req.path.startsWith('/health') || req.path.startsWith('/ready')) {
    return next();
  }

  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Endpoint not found.' });
  }
});

/**
 * Centralized Error-Handling Middleware
 */
app.use((err, req, res, next) => {
  logger.error({
    msg: 'Request error',
    requestId: req.id,
    error: err.message,
    code: err.code,
    status: err.status,
  });

  // Handle Multer upload errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File size exceeds the 5 MB limit. Please select a smaller file.',
        code: 'LIMIT_FILE_SIZE',
      });
    }
    return res.status(400).json({
      error: `File upload error: ${err.message}`,
      code: err.code,
    });
  }

  // Handle known HTTP statuses
  const status = err.status || 500;
  const responsePayload = {
    error: err.message || 'An unexpected error occurred during resume analysis.',
    code: err.code || (status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST'),
  };

  if (process.env.NODE_ENV !== 'production' && err.details) {
    responsePayload.details = err.details;
  }

  res.status(status).json(responsePayload);
});

// Start Express server if run directly
let server;
if (require.main === module) {
  server = app.listen(port, () => {
    logger.info({
      msg: `ResuMind AI backend running on port ${port}`,
      provider: process.env.AI_PROVIDER || 'gemini',
      env: process.env.NODE_ENV || 'development',
    });
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal) => {
    logger.info({ msg: `${signal} received. Closing HTTP server gracefully...` });
    server.close(() => {
      logger.info({ msg: 'HTTP server closed. Exiting process.' });
      process.exit(0);
    });

    // Force exit after 10 seconds if hanging
    setTimeout(() => {
      logger.error({ msg: 'Forcefully terminating process after timeout.' });
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

module.exports = app;
