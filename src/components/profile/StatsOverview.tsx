import React from 'react';
import { User } from '@/types';

interface StatsOverviewProps {
  user: User;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ user }) => {
  return (
    <div className="font-jetbrains grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
        <span className="text-xs text-slate-400 block mb-1">Solved Problems</span>
        <span className="text-2xl font-extrabold text-slate-100">{user.solvedCount}</span>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
        <span className="text-xs text-slate-400 block mb-1">Current Rating</span>
        <span className="text-2xl font-extrabold text-cyan-400">{user.rating}</span>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
        <span className="text-xs text-slate-400 block mb-1">Max Rating</span>
        <span className="text-2xl font-extrabold text-indigo-400">{user.maxRating}</span>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
        <span className="text-xs text-slate-400 block mb-1">Active Streak</span>
        <span className="text-2xl font-extrabold text-amber-400">{user.streakDays}d 🔥</span>
      </div>
    </div>
  );
};
