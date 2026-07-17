import React, { useEffect, useState } from 'react';
import { FileText, Cpu, Compass } from 'lucide-react';

const LOADING_PHASES = [
  { text: 'Parsing resume file format...', icon: FileText },
  { text: 'Extracting content and structure...', icon: Compass },
  { text: 'Evaluating keywords & matching job roles...', icon: Cpu },
  { text: 'Formatting career recommendations...', icon: Compass },
  { text: 'Polishing interview practice questions...', icon: FileText }
];

/**
 * Animated loading screen that cycles through analysis phases.
 */
export default function LoadingScreen() {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % LOADING_PHASES.length);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  const ActiveIcon = LOADING_PHASES[phaseIndex].icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] max-w-md mx-auto px-6 py-12 text-center animate-fade-in no-print">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-[70px] pointer-events-none -z-10"></div>

      <div className="relative w-44 h-56 glass-panel rounded-3xl p-6 flex flex-col items-center justify-center border-slate-200/50 dark:border-slate-800/40 shadow-2xl overflow-hidden group">
        <div className="laser-scanner animate-scan absolute left-0 right-0"></div>
        
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-8 gap-1 p-4 opacity-15 pointer-events-none">
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className="bg-slate-400 dark:bg-slate-500 rounded-sm"></div>
          ))}
        </div>

        <div className="p-4 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 rounded-2xl relative animate-pulse-slow">
          <FileText className="h-14 w-14" />
        </div>
      </div>

      <h2 className="text-2xl font-bold font-outfit mt-8 text-slate-800 dark:text-white">
        Analyzing Resume
      </h2>
      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest font-semibold">
        Please wait, this takes about 10-15 seconds
      </p>

      <div className="mt-8 flex items-center gap-2.5 px-5 py-3 rounded-2xl border border-indigo-200/20 dark:border-indigo-800/20 bg-indigo-500/5 dark:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 font-semibold text-sm transition-all duration-300 animate-slide-up">
        <ActiveIcon className="h-4.5 w-4.5 animate-spin" style={{ animationDuration: '4s' }} />
        <span>{LOADING_PHASES[phaseIndex].text}</span>
      </div>
    </div>
  );
}
