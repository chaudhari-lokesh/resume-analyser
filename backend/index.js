const path = require('path');
const fs = require('fs');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { parseResume } = require('./parser');
const { queryAI } = require('./ai');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Configure multer for memory storage file uploads (10MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const allowedExtensions = ['.pdf', '.docx'];
    const extension = '.' + file.originalname.split('.').pop().toLowerCase();

    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'));
    }
  },
});

// Serve frontend static assets in production
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));

/**
 * POST /analyze
 * Uploads a resume file, extracts its text, and returns the AI review JSON.
 */
app.post('/analyze', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF or DOCX resume file.' });
    }

    const { buffer, mimetype, originalname } = req.file;

    console.log(`[Server] File upload: ${originalname} (${buffer.length} bytes)`);

    // Extract text from document buffer
    const extractedText = await parseResume(buffer, mimetype, originalname);

    // Call API provider to get analysis
    const analysisResult = await queryAI(extractedText);

    return res.status(200).json(analysisResult);
  } catch (error) {
    console.error('[Error] Analyze request failed:', error.message);
    
    if (error.message.includes('API_KEY')) {
      return res.status(500).json({
        error: 'API key is missing or invalid. Please check your backend configuration.',
        details: error.message
      });
    }
    
    return res.status(500).json({ 
      error: 'An error occurred during resume analysis.',
      details: error.message 
    });
  }
});

/**
 * GET /health
 * Service status verification endpoint.
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    provider: process.env.AI_PROVIDER || 'gemini',
    port: port
  });
});

/**
 * GET *
 * Fallback to serve the React frontend index.html for client routing.
 */
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Not Found');
  }
});

// Multer and general error middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size limit exceeded. Maximum size is 10MB.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  
  next();
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(`Active AI provider: ${process.env.AI_PROVIDER || 'gemini'}`);
});
