const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const mammoth = require('mammoth');
const { detectFileTypeFromMagicBytes } = require('./security');
const logger = require('./logger');

/**
 * Extracts raw text from PDF buffer using PDF.js.
 * @param {Buffer} buffer - PDF buffer
 * @returns {Promise<string>}
 */
async function parsePDF(buffer) {
  try {
    const data = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({
      data: data,
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    const trimmed = fullText.trim();
    if (!trimmed || trimmed.length < 20) {
      const err = new Error(
        'The uploaded PDF document appears to be empty or contains scanned images without selectable text.'
      );
      err.code = 'SCANNED_OR_EMPTY_PDF';
      throw err;
    }

    return trimmed;
  } catch (error) {
    if (error.code === 'SCANNED_OR_EMPTY_PDF') throw error;
    logger.warn({ msg: 'PDF parsing error', error: error.message });
    throw new Error('Failed to parse PDF document: ' + error.message);
  }
}

/**
 * Extracts raw text from DOCX buffer using Mammoth.
 * @param {Buffer} buffer - DOCX buffer
 * @returns {Promise<string>}
 */
async function parseDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer: buffer });
    const text = (result.value || '').trim();

    if (!text || text.length < 20) {
      const err = new Error('The uploaded Word document appears to be empty or contains only non-text media.');
      err.code = 'EMPTY_DOCX';
      throw err;
    }

    return text;
  } catch (error) {
    if (error.code === 'EMPTY_DOCX') throw error;
    logger.warn({ msg: 'DOCX parsing error', error: error.message });
    throw new Error('Failed to parse DOCX document: ' + error.message);
  }
}

/**
 * Validates file signature (magic bytes) and extracts resume text in-memory.
 * @param {Buffer} buffer - Raw file buffer
 * @param {string} mimeType - Reported MIME type
 * @param {string} originalName - File name
 * @returns {Promise<string>} - Extracted text content
 */
async function parseResume(buffer, mimeType, originalName) {
  if (!buffer || buffer.length === 0) {
    const err = new Error('Empty file received.');
    err.status = 400;
    throw err;
  }

  // Magic bytes check takes precedence over file extension or user-reported MIME
  const detectedType = detectFileTypeFromMagicBytes(buffer);

  if (!detectedType) {
    const err = new Error(
      'File format mismatch. The file content does not match a valid PDF or DOCX file structure.'
    );
    err.status = 415;
    err.code = 'INVALID_FILE_SIGNATURE';
    throw err;
  }

  let text = '';
  if (detectedType === 'pdf') {
    text = await parsePDF(buffer);
  } else if (detectedType === 'docx') {
    text = await parseDOCX(buffer);
  }

  return text;
}

module.exports = {
  parsePDF,
  parseDOCX,
  parseResume,
};
