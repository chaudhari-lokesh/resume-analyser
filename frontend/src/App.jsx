import React, { useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Hero from './components/Hero';
import UploadBox from './components/UploadBox';
import LoadingSkeleton from './components/LoadingSkeleton';
import ResultsDashboard from './components/ResultsDashboard';
import ThemeToggle from './components/ThemeToggle';
import { AlertCircle, RefreshCw, FileText } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'loading' | 'results'
  const [file, setFile] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState('');

  /**
   * Submits selected resume file to backend API for parsing and analysis.
   * @param {File} selectedFile - The uploaded resume file
   */
  const handleStartAnalysis = async (selectedFile) => {
    setFile(selectedFile);
    setView('loading');
    setErrorTitle('');
    setErrorMessage('');
    setErrorDetails('');

    const formData = new FormData();
    formData.append('resume', selectedFile);

    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: formData,
      });

      let data = {};
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        if (response.status === 502) {
          throw new Error('Backend server is offline or restarting. Please verify the API server is running.');
        }
        throw new Error('Server returned an unparseable response.');
      }

      if (!response.ok) {
        const err = new Error(data.error || 'Failed to analyze resume.');
        err.status = response.status;
        err.code = data.code;
        err.details = data.details;
        throw err;
      }

      setAnalysisData(data);
      setView('results');
    } catch (err) {
      console.error('Analysis error:', err);

      let title = 'Analysis Failed';
      let message = err.message || 'Could not connect to the analysis service.';
      let details = err.details || '';

      if (err.status === 429 || err.code === 'RATE_LIMIT_EXCEEDED') {
        title = 'Rate Limit Reached';
        message = 'You have submitted too many requests recently. Please wait a few minutes before trying again.';
      } else if (err.status === 413) {
        title = 'File Too Large';
        message = 'The uploaded file exceeds the 5 MB maximum size limit. Please upload a smaller document.';
      } else if (err.status === 415) {
        title = 'Unsupported File Type';
        message = 'Only valid PDF and Microsoft Word (.docx) files are supported.';
      } else if (err.message?.includes('scanned') || err.message?.includes('empty')) {
        title = 'Document Unreadable';
        message = 'The document appears to be empty or contains scanned images without selectable text. Please upload a text-based resume.';
      } else if (err.message?.includes('timeout') || err.status === 504) {
        title = 'Analysis Request Timed Out';
        message = 'The AI provider took too long to complete the evaluation. Please try again.';
      } else if (err.message?.includes('API_KEY') || err.message?.includes('API key')) {
        title = 'Provider Configuration Notice';
        message = 'The backend AI provider key is not configured or is invalid. Please check your environment variables.';
      }

      setErrorTitle(title);
      setErrorMessage(message);
      setErrorDetails(details);
      setView('landing');
    }
  };

  /**
   * Resets workflow state back to landing/upload view.
   */
  const handleReset = () => {
    setFile(null);
    setAnalysisData(null);
    setErrorTitle('');
    setErrorMessage('');
    setErrorDetails('');
    setView('landing');
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen bg-surface-bg text-text-primary">
        {/* Minimal Navigation Bar */}
        <header className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-xs border-b border-surface-border py-3 px-6 md:px-12 flex items-center justify-between no-print transition-colors">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer focus-visible:outline-2 focus-visible:outline-accent rounded-md p-1 -m-1"
            aria-label="ResuMind AI Home"
          >
            <div className="h-7 w-7 bg-accent text-white rounded-md flex items-center justify-center font-bold text-xs tracking-tight shadow-xs">
              <FileText className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="text-base font-bold tracking-tight text-text-primary">
              ResuMind <span className="text-accent font-semibold">AI</span>
            </span>
          </button>

          <nav aria-label="Global application controls" className="flex items-center gap-3">
            <ThemeToggle />
          </nav>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow flex flex-col justify-center py-6">
          {/* Friendly Error Banner */}
          {errorMessage && view === 'landing' && (
            <div
              role="alert"
              className="max-w-2xl mx-auto w-full px-4 mb-6 animate-fade-in no-print"
            >
              <div className="p-4 rounded-xl bg-status-error-subtle border border-surface-border text-text-primary shadow-xs">
                <div className="flex gap-3 items-start">
                  <AlertCircle className="h-5 w-5 text-status-error shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="space-y-1 flex-1">
                    <p className="font-semibold text-sm text-status-error leading-tight">
                      {errorTitle || 'Analysis Failed'}
                    </p>
                    <p className="text-xs text-text-secondary leading-normal">
                      {errorMessage}
                    </p>
                    {errorDetails && (
                      <p className="text-xs text-text-tertiary mt-2 pt-2 border-t border-surface-border font-mono">
                        {errorDetails}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 py-1 px-3 rounded-md bg-surface-card border border-surface-border text-xs font-medium text-text-primary hover:bg-surface-card-subtle transition-subtle cursor-pointer focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <RefreshCw className="h-3 w-3 text-text-secondary" aria-hidden="true" />
                    <span>Dismiss</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === 'landing' && (
            <>
              <Hero />
              <UploadBox onStartAnalysis={handleStartAnalysis} />
            </>
          )}

          {view === 'loading' && <LoadingSkeleton />}

          {view === 'results' && (
            <ResultsDashboard
              data={analysisData}
              fileName={file?.name || 'Resume.pdf'}
              onReset={handleReset}
            />
          )}
        </main>

        {/* Minimal Footer */}
        <footer className="py-6 border-t border-surface-border text-center text-xs text-text-tertiary no-print">
          <div className="max-w-4xl mx-auto px-4 space-y-1">
            <p className="font-medium text-text-secondary">
              ResuMind AI &bull; Production ATS Resume Evaluation
            </p>
            <p>
              Memory-only processing. Resumes are parsed transiently and never persisted to disk or database.
            </p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
