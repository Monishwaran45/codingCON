import React from 'react';
import { Contest } from '@/types';
import { ContestTimer } from './ContestTimer';

interface ContestBannerProps {
  contest: Contest;
}

export const ContestBanner: React.FC<ContestBannerProps> = ({ contest }) => {
  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-6 font-jetbrains mb-8 transition-colors duration-150">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            <span>OFFICIAL ASSESSMENT</span>
            <span>•</span>
            <span className="text-zinc-500 dark:text-zinc-400 font-normal">{contest.participantCount.toLocaleString()} Candidates Active</span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            {contest.title}
          </h1>
        </div>

        <ContestTimer />
      </div>
    </div>
  );
};
