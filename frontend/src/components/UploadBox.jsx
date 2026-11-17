import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, X, AlertCircle, ArrowRight } from 'lucide-react';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function UploadBox({ onStartAnalysis }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef(null);

  const formatBytes = (bytes, decimals = 1) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
  };

  const validateFile = (file) => {
    if (!file) return false;

    const allowedExtensions = ['pdf', 'docx'];
    const extension = file.name.split('.').pop().toLowerCase();
    const isDocxMime = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const isPdfMime = file.type === 'application/pdf';

    if (!allowedExtensions.includes(extension) && !isPdfMime && !isDocxMime) {
      setValidationError('Unsupported format. Please upload a PDF (.pdf) or Word (.docx) document.');
      setSelectedFile(null);
      return false;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError('File exceeds the 5 MB limit. Please select a smaller document.');
      setSelectedFile(null);
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerFileInput();
    }
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setValidationError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedFile) {
      onStartAnalysis(selectedFile);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-4 mb-16 no-print">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload resume file dropzone"
          onKeyDown={handleKeyDown}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={!selectedFile ? triggerFileInput : undefined}
          className={`relative border rounded-xl p-8 sm:p-10 text-center transition-subtle flex flex-col items-center justify-center cursor-pointer ${
            dragActive
              ? 'border-accent bg-accent-subtle'
              : 'border-surface-border bg-surface-card hover:border-surface-border hover:bg-surface-card-subtle'
          } shadow-xs focus-visible:outline-2 focus-visible:outline-accent`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            aria-label="Upload resume file input"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
          />

          {!selectedFile ? (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-3 bg-surface-card-subtle rounded-lg text-accent border border-surface-border">
                <UploadCloud className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Drag and drop your resume here, or{' '}
                  <span className="text-accent underline font-medium">browse files</span>
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  Supports PDF or DOCX up to 5 MB
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 p-3 rounded-lg border border-surface-border bg-surface-card-subtle w-full max-w-md">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 rounded-md bg-accent text-white shrink-0">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="text-left truncate">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {formatBytes(selectedFile.size)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-card transition-subtle cursor-pointer focus-visible:outline-2 focus-visible:outline-accent"
                aria-label="Remove selected file"
                title="Remove file"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {validationError && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-status-error-subtle border border-surface-border text-status-error text-xs flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{validationError}</span>
          </div>
        )}

        {selectedFile && (
          <div className="flex justify-center pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold shadow-xs transition-subtle cursor-pointer focus-visible:outline-2 focus-visible:outline-accent"
            >
              <span>Analyze Resume</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
