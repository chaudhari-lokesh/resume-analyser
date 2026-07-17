import React, { useState } from 'react';
import Hero from './components/Hero';
import UploadBox from './components/UploadBox';
import LoadingScreen from './components/LoadingScreen';
import ResultsDashboard from './components/ResultsDashboard';
import ThemeToggle from './components/ThemeToggle';
import { Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

const API_BASE_URL = '';

export default function App() {
  const [view, setView] = useState('landing');
  const [file, setFile] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState('');

  /**
   * Submits selected resume file to backend API for parsing and analysis.
   * @param {File} selectedFile - The uploaded resume file
   */
  const handleStartAnalysis = async (selectedFile) => {
    setFile(selectedFile);
    setView('loading');
    setError('');
    setErrorDetails('');

    const formData = new FormData();
    formData.append('resume', selectedFile);

    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const customError = new Error(data.error || 'Failed to analyze resume.');
        customError.details = data.details;
        throw customError;
      }

      setAnalysisData(data);
      setView('results');
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Could not connect to the server.');
      setErrorDetails(
        err.details || (err.message.includes('API key') 
          ? 'Make sure the server environment variables have the active AI provider key configured.'
          : 'Please make sure the server is running and try again.')
      );
      setView('landing');
    }
  };

  /**
   * Resets workflow state back to landing/upload view.
   */
  const handleReset = () => {
    setFile(null);
    setAnalysisData(null);
    setError('');
    setErrorDetails('');
    setView('landing');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 glass-panel border-slate-200/40 dark:border-slate-800/40 border-b py-4 px-6 md:px-12 flex items-center justify-between no-print">
        <div className="flex items-center gap-2.5 hover:opacity-90 transition-opacity cursor-pointer" onClick={handleReset}>
          <div className="h-9 w-9 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/10">
            <Sparkles className="h-5 w-5 fill-white/10" />
          </div>
          <span className="text-xl font-extrabold tracking-tight font-outfit text-slate-800 dark:text-white">
            ResuMind<span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400"> AI</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-grow flex flex-col justify-center py-6">
        {error && view === 'landing' && (
          <div className="max-w-2xl mx-auto w-full px-4 mb-6 animate-fade-in no-print">
            <div className="p-5 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-350 shadow-md">
              <div className="flex gap-3 items-start">
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm leading-tight font-outfit">Analysis Failed</p>
                  <p className="text-xs leading-normal font-medium">{error}</p>
                  {errorDetails && (
                    <p className="text-xs opacity-75 font-normal mt-2 leading-relaxed pt-1.5 border-t border-rose-500/10">
                      {errorDetails}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/20 text-xs font-bold text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Dismiss & Retry</span>
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

        {view === 'loading' && <LoadingScreen />}

        {view === 'results' && (
          <ResultsDashboard 
            data={analysisData} 
            fileName={file?.name || 'Resume.pdf'} 
            onReset={handleReset} 
          />
        )}
      </main>

      <footer className="py-6 border-t border-slate-200/20 dark:border-slate-800/25 text-center text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider no-print">
        <p>© 2026 ResuMind AI. All processing is memory-based. No files are stored.</p>
      </footer>
    </div>
  );
}
