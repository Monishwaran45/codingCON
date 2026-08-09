import React from 'react';
import { LeaderboardEntry } from '@/types';

interface StickyUserRowProps {
  userRow: LeaderboardEntry;
  deltaPointsToPass: number;
}

export const StickyUserRow: React.FC<StickyUserRowProps> = ({ userRow, deltaPointsToPass }) => {
  return (
    <div className="font-inter fixed bottom-0 left-0 right-0 z-40 border-t border-blue-500/40 bg-white/95 dark:bg-zinc-950/95 p-3.5 backdrop-blur-xl shadow-2xl transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* User rank info */}
        <div className="flex items-center gap-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-extrabold text-xs text-white shadow-md shadow-blue-500/30">
            #{userRow.rank}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">{userRow.username} (You)</span>
              <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[0.62rem] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                YOUR STANDING
              </span>
            </div>
            <div className="text-[0.7rem] text-zinc-500 dark:text-zinc-400">
              Solved {userRow.solvedCount} problems • Score: <strong className="text-zinc-900 dark:text-zinc-200 font-mono">{userRow.totalScore} pts</strong>
            </div>
          </div>
        </div>

        {/* Proximity & Loss Aversion Framing */}
        {deltaPointsToPass > 0 && (
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-right">
              <span className="text-[0.6rem] uppercase text-amber-600 dark:text-amber-400 font-bold block">
                Next Rank Goal
              </span>
              <span className="text-xs text-amber-700 dark:text-amber-300 font-extrabold font-mono">
                +{deltaPointsToPass} pts to pass #{userRow.rank - 1}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
