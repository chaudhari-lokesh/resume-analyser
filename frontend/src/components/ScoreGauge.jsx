import React, { useEffect, useState } from 'react';

/**
 * Minimal, tone-based score display component.
 * Uses a thin single-color ring in the accent color, a large clean number,
 * a small label, and an accessible progressbar role.
 */
export default function ScoreGauge({ score = 0, label = '', delay = 0 }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    // Check for prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayScore(score);
      return;
    }

    const duration = 600;
    const steps = 30;
    const stepTime = duration / steps;
    let step = 0;

    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        step++;
        const progress = step / steps;
        // Ease out quad
        const eased = progress * (2 - progress);
        setDisplayScore(Math.round(eased * score));

        if (step >= steps) {
          clearInterval(interval);
          setDisplayScore(score);
        }
      }, stepTime);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [score, delay]);

  const radius = 32;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  const getSemanticBadge = (val) => {
    if (val >= 80) {
      return {
        text: 'Strong',
        className: 'text-status-success bg-status-success-subtle',
      };
    }
    if (val >= 60) {
      return {
        text: 'Moderate',
        className: 'text-status-warning bg-status-warning-subtle',
      };
    }
    return {
      text: 'Needs Review',
      className: 'text-status-error bg-status-error-subtle',
    };
  };

  const badge = getSemanticBadge(score);

  return (
    <div
      role="progressbar"
      aria-label={`${label}: ${score} percent`}
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      className="bg-surface-card border border-surface-border rounded-xl p-5 flex flex-col items-center justify-between shadow-xs transition-subtle"
    >
      <div className="relative w-20 h-20 flex items-center justify-center mb-3">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72" aria-hidden="true">
          {/* Background Track */}
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            stroke="var(--color-surface-border)"
            strokeWidth={strokeWidth}
          />
          {/* Accent Progress Indicator */}
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />
        </svg>

        <div className="absolute flex items-baseline justify-center">
          <span className="text-2xl font-bold tracking-tight text-text-primary">
            {displayScore}
          </span>
          <span className="text-[10px] text-text-tertiary ml-0.5">%</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
          {label}
        </p>
        <span
          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${badge.className}`}
        >
          {badge.text}
        </span>
      </div>
    </div>
  );
}
