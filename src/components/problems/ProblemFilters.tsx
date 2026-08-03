'use client';

import React from 'react';
import { Difficulty } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ProblemFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedDifficulty: Difficulty | 'all';
  onDifficultyChange: (d: Difficulty | 'all') => void;
  selectedStatus: 'all' | 'solved' | 'unsolved';
  onStatusChange: (s: 'all' | 'solved' | 'unsolved') => void;
  sortBy: 'recent' | 'difficulty' | 'acceptance';
  onSortChange: (s: 'recent' | 'difficulty' | 'acceptance') => void;
}

export const ProblemFilters: React.FC<ProblemFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedDifficulty,
  onDifficultyChange,
  selectedStatus,
  onStatusChange,
  sortBy,
  onSortChange,
}) => {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/40 p-4 sm:flex-row sm:items-center sm:justify-between font-jetbrains transition-all backdrop-blur-md shadow-sm">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md group">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by problem title or tag..."
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 pl-9 pr-4 py-2 text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all shadow-inner dark:shadow-black/20"
        />
      </div>

      {/* Filter & Sort controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Difficulty Filter */}
        <div className="flex items-center gap-1 bg-zinc-100/80 dark:bg-zinc-950/80 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800/80 transition-colors shadow-inner dark:shadow-black/20">
          {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => onDifficultyChange(diff)}
              className={cn(
                'relative text-[0.7rem] font-bold px-3 py-1 rounded-md capitalize transition-colors z-10',
                selectedDifficulty === diff
                  ? 'text-white'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              )}
            >
              {selectedDifficulty === diff && (
                <motion.div
                  layoutId="diffIndicator"
                  className={cn(
                    "absolute inset-0 rounded-md -z-10 shadow-sm",
                    diff === 'easy' ? 'bg-emerald-500' : diff === 'medium' ? 'bg-amber-500' : diff === 'hard' ? 'bg-red-500' : 'bg-blue-600'
                  )}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {diff}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value as 'all' | 'solved' | 'unsolved')}
          className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all shadow-sm"
        >
          <option value="all">Status: All</option>
          <option value="solved">Status: Solved</option>
          <option value="unsolved">Status: Unsolved</option>
        </select>

        {/* Sort selector */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as 'recent' | 'difficulty' | 'acceptance')}
          className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all shadow-sm"
        >
          <option value="recent">Sort: Recently Attempted</option>
          <option value="difficulty">Sort: Difficulty</option>
          <option value="acceptance">Sort: Acceptance Rate</option>
        </select>
      </div>
    </div>
  );
};
