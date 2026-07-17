try {
  const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
  console.log('✅ PDF.js (pdfjs-dist) legacy build imported successfully!');
} catch (err) {
  console.error('❌ Failed to import PDF.js:', err.message);
}

try {
  const mammoth = require('mammoth');
  console.log('✅ Mammoth.js imported successfully!');
} catch (err) {
  console.error('❌ Failed to import Mammoth.js:', err.message);
}
