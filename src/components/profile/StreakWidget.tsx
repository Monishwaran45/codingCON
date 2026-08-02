'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface StreakWidgetProps {
  streakDays: number;
}

export const StreakWidget: React.FC<StreakWidgetProps> = ({ streakDays }) => {
  return (
    <motion.div
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.2 }}
      className="font-jetbrains flex items-center gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur-md shadow-lg shadow-amber-500/5"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-black text-xl shadow-lg shadow-amber-500/30">
        🔥
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold text-slate-100">{streakDays} Days</span>
          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[0.65rem] font-bold text-amber-400 border border-amber-500/40">
            ACTIVE STREAK
          </span>
        </div>
        <p className="text-xs text-amber-200/80 mt-0.5">
          Great consistency! Keep solving daily to maintain your rating momentum.
        </p>
      </div>
    </motion.div>
  );
};
