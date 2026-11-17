import React from 'react';
import { Cpu, ShieldCheck, Zap, Sparkles } from 'lucide-react';

/**
 * Minimal, clean landing hero section.
 */
export default function Hero() {
  return (
    <section className="text-center pt-8 pb-10 max-w-3xl mx-auto px-4 no-print animate-fade-in">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-surface-border bg-surface-card-subtle text-text-secondary text-xs font-medium mb-6">
        <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
        <span>Applicant Tracking System Optimizer</span>
      </div>

      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-text-primary mb-4">
        ATS Resume Review & Career Analytics
      </h1>

      <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
        Upload your PDF or DOCX resume for keyword coverage, formatting verification, role recommendations, and mock interview coaching.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
        {[
          { icon: Cpu, text: 'ATS Scoring' },
          { icon: ShieldCheck, text: 'Memory-Only (No PII)' },
          { icon: Zap, text: 'PDF & DOCX Support' },
          { icon: Sparkles, text: 'Interview Prep' },
        ].map((feat, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-surface-border bg-surface-card text-text-secondary text-xs font-medium shadow-xs"
          >
            <feat.icon className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
            <span className="truncate">{feat.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
