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
  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'font-inter transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50',
        isCurrentUser && 'bg-blue-50/70 dark:bg-blue-950/20 border-l-4 border-l-blue-600'
      )}
    >
      {/* Rank Column */}
      <td className="px-4 py-3.5 text-center font-mono font-bold">
        {entry.rank === 1 ? (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs shadow-xs">
            🥇 1
          </span>
        ) : entry.rank === 2 ? (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 text-xs shadow-xs">
            🥈 2
          </span>
        ) : entry.rank === 3 ? (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-200/60 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 border border-amber-300/60 dark:border-amber-800/40 text-xs shadow-xs">
            🥉 3
          </span>
        ) : (
          <span className="text-zinc-500 dark:text-zinc-400 text-xs">#{entry.rank}</span>
        )}
      </td>

      {/* Handle Column */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-xs shrink-0">
            {entry.username ? entry.username[0].toUpperCase() : 'U'}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-900 dark:text-zinc-100">{entry.username}</span>
            {isCurrentUser && (
              <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[0.62rem] font-extrabold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                YOU
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Solved Count */}
      <td className="px-4 py-3.5 text-center">
        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
          {entry.solvedCount}
        </span>
        <span className="text-[0.7rem] text-zinc-400"> solved</span>
      </td>

      {/* Total Score */}
      <td className="px-4 py-3.5 text-center">
        <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-sm">
          {entry.totalScore}
        </span>
        <span className="text-[0.65rem] text-zinc-400 ml-0.5">pts</span>
      </td>

      {/* Penalty Time */}
      <td className="px-4 py-3.5 text-center text-xs text-zinc-500 dark:text-zinc-400 font-mono">
        {entry.penaltyTimeMinutes}m
      </td>
    </motion.tr>
  );
};
