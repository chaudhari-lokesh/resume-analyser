import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, X, AlertCircle, ArrowRight } from 'lucide-react';

/**
 * Handle document upload (PDF/DOCX) with drag-and-drop support.
 */
export default function UploadBox({ onStartAnalysis }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!file) return false;
    
    const allowedExtensions = ['pdf', 'docx'];
    const extension = file.name.split('.').pop().toLowerCase();
    const isDocxMime = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const isPdfMime = file.type === 'application/pdf';
    
    if (!allowedExtensions.includes(extension) && !isPdfMime && !isDocxMime) {
      setValidationError('Invalid file format. Please upload a PDF or DOCX file.');
      setSelectedFile(null);
      return false;
    }
    
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setValidationError('File size exceeds the limit. Maximum allowed size is 10MB.');
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

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const clearFile = () => {
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

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-4 mb-16 animate-slide-up z-10 no-print">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={!selectedFile ? onButtonClick : undefined}
          className={`relative border-2 border-dashed rounded-3xl p-8 md:p-12 text-center transition-all duration-300 glass-panel cursor-pointer flex flex-col items-center justify-center ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 scale-[1.01]'
              : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/20'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
          />

          {!selectedFile ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-500 group-hover:scale-110 transition-transform duration-300">
                <UploadCloud className="h-10 w-10 animate-bounce" style={{ animationDuration: '3s' }} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200 font-outfit">
                  Drag and drop your resume here
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                  or <span className="text-indigo-600 dark:text-indigo-400 font-semibold underline">browse file</span> from device
                </p>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold pt-2">
                Supports PDF & DOCX (Max 10MB)
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full space-y-4 p-2">
              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-200/20 dark:border-indigo-800/30 w-full max-w-md relative">
                <div className="p-3 bg-indigo-500 text-white rounded-xl">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="text-left overflow-hidden pr-8">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate font-outfit">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                    {formatBytes(selectedFile.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
              <p className="text-xs text-indigo-500 font-medium">Ready for analysis</p>
            </div>
          )}
        </div>

        {validationError && (
          <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-semibold animate-shake">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {selectedFile && (
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-base font-bold shadow-lg shadow-indigo-500/20 dark:shadow-indigo-950/40 hover:shadow-indigo-500/30 hover:scale-[1.005] active:scale-[0.995] transition-all duration-200 cursor-pointer"
          >
            <span>Analyze Resume</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        )}
      </form>
    </div>
  );
}
