'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LeaderboardEntry } from '@/types';
import { cn } from '@/lib/utils';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}

export const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ entry, isCurrentUser }) => {
  const isTop3 = entry.rank <= 3;
  const rankColors = {
    1: 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black',
    2: 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-950 font-black',
    3: 'bg-gradient-to-r from-amber-700 to-amber-900 text-amber-200 font-black',
  };

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'border-b border-slate-800/80 font-jetbrains transition-colors hover:bg-slate-900/50',
        isCurrentUser && 'bg-cyan-500/10 border-l-4 border-l-cyan-500'
      )}
    >
      {/* Rank Column */}
      <td className="px-4 py-3 text-center">
        <span
          className={cn(
            'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
            isTop3 ? rankColors[entry.rank as 1 | 2 | 3] : 'text-slate-400'
          )}
        >
          {entry.rank}
        </span>
      </td>

      {/* Handle Column */}
      <td className="px-4 py-3 font-semibold text-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300">
            {entry.username[0].toUpperCase()}
          </div>
          <span>{entry.username}</span>
          {isCurrentUser && (
            <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[0.6rem] font-bold text-cyan-400 border border-cyan-500/30">
              YOU
            </span>
          )}
        </div>
      </td>

      {/* Solved Count */}
      <td className="px-4 py-3 text-center font-bold text-slate-200">
        {entry.solvedCount}
      </td>

      {/* Total Score */}
      <td className="px-4 py-3 text-center font-bold text-cyan-400">
        {entry.totalScore}
      </td>

      {/* Penalty Time */}
      <td className="px-4 py-3 text-center text-xs text-slate-400 font-mono">
        {entry.penaltyTimeMinutes}m
      </td>
    </motion.tr>
  );
};
