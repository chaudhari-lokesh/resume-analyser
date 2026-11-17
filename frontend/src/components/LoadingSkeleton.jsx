import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const LOADING_STAGES = [
  'Extracting document content and structure...',
  'Evaluating ATS keyword density and formatting...',
  'Analyzing syntax, grammar, and impact metrics...',
  'Generating role-specific recommendations...',
  'Finalizing mock interview questions...',
];

export default function LoadingSkeleton() {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % LOADING_STAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="max-w-4xl mx-auto px-4 py-12 animate-fade-in no-print"
    >
      <div className="flex flex-col items-center justify-center text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-surface-border bg-surface-card text-text-secondary text-xs font-medium mb-3">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" aria-hidden="true" />
          <span>{LOADING_STAGES[stageIndex]}</span>
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">
          Analyzing Your Resume
        </h2>
        <p className="text-xs text-text-secondary mt-1">
          This typically takes 8 to 15 seconds. Memory-only processing.
        </p>
      </div>

      {/* Score Cards Skeleton Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface-card border border-surface-border rounded-xl p-5 flex flex-col items-center justify-center space-y-3"
          >
            <div className="w-16 h-16 rounded-full bg-surface-card-subtle animate-pulse" />
            <div className="w-20 h-3 rounded bg-surface-card-subtle animate-pulse" />
            <div className="w-12 h-2.5 rounded bg-surface-card-subtle animate-pulse" />
          </div>
        ))}
      </div>

      {/* Content Section Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-4">
          <div className="w-32 h-4 rounded bg-surface-card-subtle animate-pulse" />
          <div className="space-y-2">
            <div className="w-full h-3 rounded bg-surface-card-subtle animate-pulse" />
            <div className="w-5/6 h-3 rounded bg-surface-card-subtle animate-pulse" />
            <div className="w-4/6 h-3 rounded bg-surface-card-subtle animate-pulse" />
          </div>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-4">
          <div className="w-36 h-4 rounded bg-surface-card-subtle animate-pulse" />
          <div className="space-y-2">
            <div className="w-full h-3 rounded bg-surface-card-subtle animate-pulse" />
            <div className="w-5/6 h-3 rounded bg-surface-card-subtle animate-pulse" />
            <div className="w-3/4 h-3 rounded bg-surface-card-subtle animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
