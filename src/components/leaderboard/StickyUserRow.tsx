import React from 'react';
import { LeaderboardEntry } from '@/types';

interface StickyUserRowProps {
  userRow: LeaderboardEntry;
  deltaPointsToPass: number;
}

export const StickyUserRow: React.FC<StickyUserRowProps> = ({ userRow, deltaPointsToPass }) => {
  return (
    <div className="font-jetbrains fixed bottom-0 left-0 right-0 z-40 border-t-2 border-blue-500 bg-zinc-950/95 p-4 backdrop-blur-xl shadow-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* User rank info */}
        <div className="flex items-center gap-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-extrabold text-sm text-white shadow-md shadow-blue-500/30">
            #{userRow.rank}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-100 text-sm">{userRow.username} (You)</span>
              <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[0.65rem] font-bold text-blue-400 border border-blue-500/40">
                YOUR RANK
              </span>
            </div>
            <div className="text-xs text-zinc-400">
              Solved {userRow.solvedCount} problems • Score: <strong className="text-zinc-200">{userRow.totalScore} pts</strong>
            </div>
          </div>
        </div>

        {/* Proximity & Loss Aversion Framing */}
        {deltaPointsToPass > 0 && (
          <div className="flex items-center gap-3">
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-right">
              <span className="text-[0.65rem] uppercase text-amber-400 font-bold block">
                Proximity Goal
              </span>
              <span className="text-xs text-amber-300 font-extrabold">
                +{deltaPointsToPass} pts to pass rank #{userRow.rank - 1}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
