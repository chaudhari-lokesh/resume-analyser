const { describe, it } = require('node:test');
const assert = require('node:assert');
const { detectFileTypeFromMagicBytes, isOriginAllowed } = require('../security');
const { parseResume } = require('../parser');

describe('Security & File Validation Tests', () => {
  it('detects a valid PDF from magic bytes %PDF-', () => {
    const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    const detected = detectFileTypeFromMagicBytes(pdfBuffer);
    assert.strictEqual(detected, 'pdf');
  });

  it('detects a valid DOCX from ZIP container magic bytes PK\\x03\\x04', () => {
    const docxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
    const detected = detectFileTypeFromMagicBytes(docxBuffer);
    assert.strictEqual(detected, 'docx');
  });

  it('rejects an executable or script disguised with .pdf extension', () => {
    const fakePdfBuffer = Buffer.from('#!/bin/bash\necho "Malicious code"');
    const detected = detectFileTypeFromMagicBytes(fakePdfBuffer);
    assert.strictEqual(detected, null);
  });

  it('rejects empty or very short buffers', () => {
    const emptyBuffer = Buffer.from([]);
    const shortBuffer = Buffer.from([0x25, 0x50]);
    assert.strictEqual(detectFileTypeFromMagicBytes(emptyBuffer), null);
    assert.strictEqual(detectFileTypeFromMagicBytes(shortBuffer), null);
  });

  it('parseResume throws 415 error on mismatched magic bytes', async () => {
    const fakeBuffer = Buffer.from('Plain text claiming to be a PDF');
    await assert.rejects(
      async () => {
        await parseResume(fakeBuffer, 'application/pdf', 'resume.pdf');
      },
      (err) => {
        assert.strictEqual(err.status, 415);
        assert.strictEqual(err.code, 'INVALID_FILE_SIGNATURE');
        return true;
      }
    );
  });

  it('isOriginAllowed allows empty origin (direct navigation, server-to-server)', () => {
    assert.strictEqual(isOriginAllowed('', null), true);
    assert.strictEqual(isOriginAllowed(null, null), true);
  });

  it('isOriginAllowed allows Render subdomains and localhost', () => {
    assert.strictEqual(isOriginAllowed('https://resume-analyser-ftvk.onrender.com', null), true);
    assert.strictEqual(isOriginAllowed('http://localhost:5173', null), true);
  });

  it('isOriginAllowed allows same-origin requests matching Host header', () => {
    const fakeReq = { headers: { host: 'custom-resume.com' } };
    assert.strictEqual(isOriginAllowed('https://custom-resume.com', fakeReq), true);
  });
});
