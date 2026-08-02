import React from 'react';
import { User } from '@/types';

interface StatsOverviewProps {
  user: User;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ user }) => {
  return (
    <div className="font-jetbrains grid grid-cols-2 gap-4 sm:grid-cols-3">
      <div className="rounded-md border border-zinc-850 bg-zinc-950 p-4 text-center">
        <span className="text-xs text-zinc-500 block mb-1">Solved Problems</span>
        <span className="text-xl font-bold text-zinc-100">{user.solvedCount}</span>
      </div>

      <div className="rounded-md border border-zinc-850 bg-zinc-950 p-4 text-center">
        <span className="text-xs text-zinc-500 block mb-1">Current Rating</span>
        <span className="text-xl font-bold text-blue-400">{user.rating}</span>
      </div>

      <div className="rounded-md border border-zinc-850 bg-zinc-950 p-4 text-center">
        <span className="text-xs text-zinc-500 block mb-1">Max Rating</span>
        <span className="text-xl font-bold text-zinc-300">{user.maxRating}</span>
      </div>
    </div>
  );
};
