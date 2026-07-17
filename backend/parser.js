const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const mammoth = require('mammoth');

/**
 * Extracts raw text from PDF buffer using PDF.js.
 * @param {Buffer} buffer - PDF buffer data
 * @returns {Promise<string>} - Extracted text content
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
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    if (!fullText.trim()) {
      throw new Error('PDF file appears to be empty or contains scanned images (no selectable text).');
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF: ' + error.message);
  }
}

/**
 * Extracts raw text from DOCX buffer using mammoth.
 * @param {Buffer} buffer - DOCX buffer data
 * @returns {Promise<string>} - Extracted text content
 */
async function parseDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer: buffer });
    const text = result.value;
    
    if (!text.trim()) {
      throw new Error('DOCX file appears to be empty.');
    }
    
    return text.trim();
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw new Error('Failed to parse DOCX: ' + error.message);
  }
}

/**
 * Parses resume document buffer and extracts text based on file format.
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - Uploaded file MIME type
 * @param {string} originalName - Original file name
 * @returns {Promise<string>} - Extracted text content
 */
async function parseResume(buffer, mimeType, originalName) {
  const extension = originalName.split('.').pop().toLowerCase();
  
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return await parsePDF(buffer);
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
    extension === 'docx'
  ) {
    return await parseDOCX(buffer);
  } else {
    throw new Error('Unsupported format. Please upload a PDF or DOCX file.');
  }
}

module.exports = {
  parsePDF,
  parseDOCX,
  parseResume
};
