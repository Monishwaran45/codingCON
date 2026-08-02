'use client';

import React from 'react';
import { Difficulty } from '@/types';
import { cn } from '@/lib/utils';

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
    <div className="flex flex-col gap-4 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-4 sm:flex-row sm:items-center sm:justify-between font-jetbrains transition-colors">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by problem title or tag..."
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-blue-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Filter & Sort controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Difficulty Filter */}
        <div className="flex items-center gap-1 bg-white dark:bg-zinc-950 p-1 rounded-md border border-zinc-300 dark:border-zinc-800 transition-colors">
          {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => onDifficultyChange(diff)}
              className={cn(
                'text-[0.7rem] font-bold px-2.5 py-1 rounded capitalize transition-colors',
                selectedDifficulty === diff
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 border border-zinc-300 dark:border-zinc-700'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              )}
            >
              {diff}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value as 'all' | 'solved' | 'unsolved')}
          className="rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-200 focus:border-blue-500 focus:outline-none transition-colors"
        >
          <option value="all">All Status</option>
          <option value="solved">Solved Only</option>
          <option value="unsolved">Unsolved Only</option>
        </select>

        {/* Sort selector */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as 'recent' | 'difficulty' | 'acceptance')}
          className="rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold focus:border-blue-500 focus:outline-none transition-colors"
        >
          <option value="recent">Sort: Recently Attempted</option>
          <option value="difficulty">Sort: Difficulty</option>
          <option value="acceptance">Sort: Acceptance Rate</option>
        </select>
      </div>
    </div>
  );
};
