const rateLimit = require('express-rate-limit');

/**
 * Checks file buffer magic bytes to ensure the uploaded file matches its declared format.
 * Prevents file-extension spoofing (e.g. executable or script renamed to .pdf).
 *
 * @param {Buffer} buffer - File buffer
 * @returns {'pdf' | 'docx' | null}
 */
function detectFileTypeFromMagicBytes(buffer) {
  if (!buffer || buffer.length < 4) {
    return null;
  }

  // PDF starts with '%PDF-' (0x25, 0x50, 0x44, 0x46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return 'pdf';
  }

  // DOCX is a ZIP container: 'PK\x03\x04' (0x50, 0x4B, 0x03, 0x04)
  if (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    return 'docx';
  }

  return null;
}

/**
 * Parses allowed CORS origins from environment variable.
 */
function getCorsOrigins() {
  const allowed = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN;
  if (!allowed) {
    return [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5000',
    ];
  }

  return allowed
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * Robust CORS origin checker:
 * - Always allows requests without Origin (same-origin, curl, server-to-server)
 * - Always allows same-origin requests where origin host matches current host
 * - Auto-allows all Render deployment domains (*.onrender.com) and localhost
 * - Respects explicit ALLOWED_ORIGINS allowlist
 */
function isOriginAllowed(origin, req) {
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const currentHost = (req && req.headers && (req.headers['x-forwarded-host'] || req.headers.host)) || '';

    // Same-origin check
    if (currentHost && (originUrl.host === currentHost || currentHost.startsWith(originUrl.host))) {
      return true;
    }

    // Auto-allow all Render deployment subdomains and localhost
    if (
      originUrl.hostname.endsWith('.onrender.com') ||
      originUrl.hostname === 'localhost' ||
      originUrl.hostname === '127.0.0.1'
    ) {
      return true;
    }
  } catch {
    // If origin URL fails to parse, check explicit string list
  }

  const allowed = getCorsOrigins();
  if (allowed.includes('*') || allowed.includes(origin)) {
    return true;
  }

  return false;
}

/**
 * General rate limiter: 100 requests per 15 minutes.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

/**
 * Tighter rate limiter on /analyze: 15 requests per 15 minutes per IP.
 */
const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Analysis rate limit reached. Please wait a few minutes before submitting another resume.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

module.exports = {
  detectFileTypeFromMagicBytes,
  getCorsOrigins,
  isOriginAllowed,
  generalLimiter,
  analyzeLimiter,
};
