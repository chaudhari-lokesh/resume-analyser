const pino = require('pino');

/**
 * Production-ready structured logger using Pino.
 * Explicitly redacts any sensitive credentials and prevents logging of resume text or PII.
 */
const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers["x-api-key"]',
      '*.apiKey',
      '*.api_key',
      '*.GEMINI_API_KEY',
      '*.OPENAI_API_KEY',
      '*.CLAUDE_API_KEY',
      '*.OPENROUTER_API_KEY',
      '*.GROK_API_KEY',
      'resumeText',
      'extractedText',
      'text',
      'buffer'
    ],
    remove: true,
  },
});

module.exports = logger;
