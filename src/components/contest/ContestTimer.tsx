'use client';

import React, { useEffect } from 'react';
import { useContestStore } from '@/store/useContestStore';
import { cn } from '@/lib/utils';

export const ContestTimer: React.FC = () => {
  const { timeRemainingSeconds, updateTimer } = useContestStore();

  useEffect(() => {
    const interval = setInterval(() => {
      updateTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [updateTimer]);

  const hrs = String(Math.floor(timeRemainingSeconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((timeRemainingSeconds % 3600) / 60)).padStart(2, '0');
  const secs = String(timeRemainingSeconds % 60).padStart(2, '0');

  // Yerkes-Dodson Escalation rules
  const isAmber = timeRemainingSeconds <= 900 && timeRemainingSeconds > 300; // <= 15 min
  const isRed = timeRemainingSeconds <= 300;                                // <= 5 min

  return (
    <div
      className={cn(
        'font-jetbrains flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold transition-all duration-300',
        isRed
          ? 'border-red-500/50 bg-red-500/20 text-red-400 animate-pulse shadow-lg shadow-red-500/20'
          : isAmber
          ? 'border-amber-500/50 bg-amber-500/15 text-amber-400'
          : 'border-slate-800 bg-slate-900/80 text-slate-300'
      )}
    >
      <span className="text-slate-500 font-normal">Ends in:</span>
      <span className="tracking-widest font-mono text-sm">{hrs}:{mins}:{secs}</span>
    </div>
  );
};
