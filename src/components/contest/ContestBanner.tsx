import React from 'react';
import { Contest } from '@/types';
import { ContestTimer } from './ContestTimer';

interface ContestBannerProps {
  contest: Contest;
}

export const ContestBanner: React.FC<ContestBannerProps> = ({ contest }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md shadow-xl font-jetbrains mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
            <span>OFFICIAL CONTEST</span>
            <span>•</span>
            <span className="text-slate-400">{contest.participantCount.toLocaleString()} Participants</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100 sm:text-3xl">
            {contest.title}
          </h1>
        </div>

        <ContestTimer />
      </div>
    </div>
  );
};
