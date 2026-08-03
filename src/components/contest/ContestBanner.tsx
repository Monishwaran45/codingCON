'use client';

import React from 'react';
import { Contest } from '@/types';
import { ContestTimer } from './ContestTimer';

interface ContestBannerProps {
  contest: Contest;
}

export const ContestBanner: React.FC<ContestBannerProps> = ({ contest }) => {
  const isEnded = new Date(contest.endTime) < new Date();
  const startDate = new Date(contest.startTime).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 font-inter transition-colors duration-150">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {isEnded ? (
              <span className="inline-flex items-center gap-1.5 text-[0.62rem] font-semibold px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Ended
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[0.62rem] font-semibold px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                In Progress
              </span>
            )}
            <span className="text-[0.7rem] text-zinc-400 dark:text-zinc-500">{startDate}</span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {contest.title}
          </h1>
          <div className="flex items-center gap-4 text-[0.7rem] text-zinc-500 dark:text-zinc-400">
            <span>{contest.problems.length} problems</span>
            <span className="w-px h-3 bg-zinc-200 dark:bg-zinc-800" />
            <span>{contest.durationMinutes} min</span>
            <span className="w-px h-3 bg-zinc-200 dark:bg-zinc-800" />
            <span>{contest.maxScore} pts max</span>
          </div>
          {isEnded && (
            <p className="text-[0.68rem] text-zinc-400 dark:text-zinc-500 mt-1">
              These problems have been archived and are available for practice in the Problem Archive.
            </p>
          )}
        </div>

        {!isEnded && <ContestTimer />}
      </div>
    </div>
  );
};
