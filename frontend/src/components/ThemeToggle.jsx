import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

/**
 * Theme toggle switch component for light and dark modes.
 */
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/40 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-md text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-105 active:scale-95 transition-all duration-200 no-print"
      aria-label="Toggle Theme"
      id="theme-toggle"
    >
      {isDark ? (
        <Sun className="h-5 w-5 animate-pulse-slow" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
