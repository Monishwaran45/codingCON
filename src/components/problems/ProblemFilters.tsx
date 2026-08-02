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
    <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:flex-row sm:items-center sm:justify-between font-jetbrains">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by problem title or tag..."
          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
        />
      </div>

      {/* Filter & Sort controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Difficulty Filter */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => onDifficultyChange(diff)}
              className={cn(
                'text-[0.7rem] font-bold px-2.5 py-1 rounded-md capitalize transition-colors',
                selectedDifficulty === diff
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {diff}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value as any)}
          className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="solved">Solved Only</option>
          <option value="unsolved">Unsolved Only</option>
        </select>

        {/* Sort selector — Default = Recently Attempted */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as any)}
          className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-cyan-400 font-semibold focus:border-cyan-500 focus:outline-none"
        >
          <option value="recent">Sort: Recently Attempted</option>
          <option value="difficulty">Sort: Difficulty</option>
          <option value="acceptance">Sort: Acceptance Rate</option>
        </select>
      </div>
    </div>
  );
};
