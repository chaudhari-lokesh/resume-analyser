import React from 'react';
import { Sparkles, Shield, Cpu, Zap } from 'lucide-react';

/**
 * Landing page hero section highlighting features and value proposition.
 */
export default function Hero() {
  return (
    <div className="relative text-center py-10 md:py-16 max-w-4xl mx-auto px-4 z-10 animate-fade-in no-print">
      <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-[80px] pointer-events-none -z-10"></div>
      <div className="absolute top-[80px] left-[10%] w-[200px] h-[200px] bg-blue-500/10 dark:bg-blue-500/10 rounded-full blur-[60px] pointer-events-none -z-10"></div>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-200/50 dark:border-indigo-800/30 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold tracking-wide uppercase mb-6 animate-pulse-slow">
        <Sparkles className="h-3.5 w-3.5 fill-indigo-500/20" />
        <span>Next-Gen ATS Optimizer</span>
      </div>

      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-outfit tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6">
        Optimize Your Resume
        <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-purple-400 dark:to-blue-400">
          For Applicant Tracking Systems
        </span>
      </h1>

      <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
        Get immediate, detailed feedback on your resume. Identify grammar issues, discover missing industry keywords, practice tailored interview questions, and outsmart recruitment bots.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
        {[
          { icon: Cpu, text: 'AI-Powered Grading' },
          { icon: Shield, text: 'Privacy First - No Logs' },
          { icon: Zap, text: 'Instant PDF/DOCX Parsing' },
          { icon: Sparkles, text: 'Smart Career Advice' }
        ].map((feat, idx) => (
          <div 
            key={idx} 
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm text-slate-700 dark:text-slate-300 shadow-sm"
          >
            <feat.icon className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-semibold">{feat.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
