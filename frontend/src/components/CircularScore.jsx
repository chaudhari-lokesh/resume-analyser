import React, { useEffect, useState } from 'react';

/**
 * Animated SVG circular score display component.
 */
export default function CircularScore({ score = 0, label = '', colors = { text: 'text-indigo-600', ring: 'stroke-indigo-500', glow: 'shadow-indigo-500/10' }, delay = 0 }) {
  const [currentScore, setCurrentScore] = useState(0);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentScore / 100) * circumference;

  useEffect(() => {
    // Count up animation with quad ease-out
    const duration = 1200;
    const steps = 60;
    const stepTime = duration / steps;
    let step = 0;

    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        step++;
        const progress = step / steps;
        const easedProgress = progress * (2 - progress);
        setCurrentScore(Math.round(easedProgress * score));

        if (step >= steps) {
          clearInterval(interval);
          setCurrentScore(score);
        }
      }, stepTime);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [score, delay]);

  const getScoreColor = (val) => {
    if (val >= 80) return 'text-emerald-500 dark:text-emerald-400';
    if (val >= 60) return 'text-amber-500 dark:text-amber-400';
    return 'text-rose-500 dark:text-rose-400';
  };

  return (
    <div className={`glass-panel rounded-2xl p-5 flex flex-col items-center justify-center transition-all duration-300 hover:scale-102 hover:shadow-lg ${colors.glow} border-slate-200/50 dark:border-slate-800/40 relative overflow-hidden group`}>
      <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-blue-500/0 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>

      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-slate-100 dark:stroke-slate-800/50 fill-none"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            className={`fill-none ${colors.ring} transition-all duration-1000 ease-out`}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold font-outfit tracking-tight text-slate-800 dark:text-slate-100">
            {currentScore}
          </span>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest -mt-0.5">
            %
          </span>
        </div>
      </div>

      <h3 className="mt-4 font-semibold text-sm tracking-wide text-slate-500 dark:text-slate-400 text-center uppercase">
        {label}
      </h3>
      
      <div className={`mt-1 text-xs font-bold ${getScoreColor(score)}`}>
        {score >= 80 ? 'Excellent' : score >= 60 ? 'Needs Tweaking' : 'Critical Review'}
      </div>
    </div>
  );
}
