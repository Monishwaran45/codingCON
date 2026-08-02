'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Verdict } from '@/types';
import { VERDICT_CONFIG } from '@/lib/constants';
import { formatTime, formatMemory } from '@/lib/utils';

interface VerdictBannerProps {
  verdict: Verdict;
  executionTimeMs: number;
  memoryKb: number;
  passedTestCases: number;
  totalTestCases: number;
}

export const VerdictBanner: React.FC<VerdictBannerProps> = ({
  verdict,
  executionTimeMs,
  memoryKb,
  passedTestCases,
  totalTestCases,
}) => {
  const isAccepted = verdict === 'AC';
  const config = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.pending;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`font-jetbrains flex items-center justify-between rounded-xl border p-4 shadow-lg ${config.bg}`}
    >
      <div className="flex items-center gap-3">
        {/* Animated Checkmark Draw-In (300-400ms) for AC reward moment */}
        {isAccepted ? (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.35, type: 'spring', stiffness: 200 }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-black text-lg shadow-lg shadow-emerald-500/30"
          >
            ✓
          </motion.div>
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400 font-black text-lg border border-red-500/40">
            ✗
          </div>
        )}

        <div>
          <div className={`text-base font-extrabold tracking-tight ${config.color}`}>
            {config.label}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Passed {passedTestCases}/{totalTestCases} test suites
          </div>
        </div>
      </div>

      <div className="text-right text-xs text-slate-400">
        <div>Runtime: <span className="font-semibold text-slate-200">{formatTime(executionTimeMs)}</span></div>
        <div>Memory: <span className="font-semibold text-slate-200">{formatMemory(memoryKb)}</span></div>
      </div>
    </motion.div>
  );
};
