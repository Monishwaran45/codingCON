import React from 'react';
import { User } from '@/types';

interface StatsOverviewProps {
  user: User;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ user }) => {
  return (
    <div className="font-jetbrains grid grid-cols-2 gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-4 text-center">
        <span className="text-xs text-zinc-500 block mb-1">Solved Problems</span>
        <span className="text-2xl font-extrabold text-white">{user.solvedCount}</span>
      </div>

      <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-4 text-center">
        <span className="text-xs text-zinc-500 block mb-1">Total Points</span>
        <span className="text-2xl font-extrabold text-amber-400">{user.totalPoints || 0}</span>
      </div>
    </div>
  );
};
