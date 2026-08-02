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
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`font-jetbrains flex items-center justify-between rounded-md border p-3 ${config.bg}`}
    >
      <div className="flex items-center gap-3">
        {isAccepted ? (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-zinc-950 font-bold text-sm">
            ✓
          </div>
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400 font-bold text-sm border border-red-500/40">
            ✗
          </div>
        )}

        <div>
          <div className={`text-sm font-bold tracking-tight ${config.color}`}>
            {config.label}
          </div>
          <div className="text-xs text-zinc-400 mt-0.5">
            Passed {passedTestCases}/{totalTestCases} test cases
          </div>
        </div>
      </div>

      <div className="text-right text-xs text-zinc-400">
        <div>Runtime: <span className="font-medium text-zinc-200">{formatTime(executionTimeMs)}</span></div>
        <div>Memory: <span className="font-medium text-zinc-200">{formatMemory(memoryKb)}</span></div>
      </div>
    </motion.div>
  );
};
