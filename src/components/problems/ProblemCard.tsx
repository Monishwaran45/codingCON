import React from 'react';
import Link from 'next/link';
import { Problem } from '@/types';
import { DifficultyBadge } from '@/components/ui/DifficultyBadge';
import { cn } from '@/lib/utils';

interface ProblemCardProps {
  problem: Problem;
}

export const ProblemCard: React.FC<ProblemCardProps> = ({ problem }) => {
  return (
    <Link
      href={`/problems/${problem.id}`}
<<<<<<< HEAD
      className="group relative flex flex-col justify-between rounded-md border border-zinc-900 bg-zinc-950 p-5 hover:border-zinc-700 hover:bg-zinc-900/40 transition-all duration-150 shadow-md"
=======
      className="group relative flex flex-col justify-between rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-all duration-150 shadow-sm"
>>>>>>> 1ac750ce303750f74a1d94c81eb62bf168acf045
    >
      <div>
        {/* Top Header Row: Status icon + Title + Difficulty */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <div
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-bold text-xs font-jetbrains',
                problem.isSolved
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : problem.isAttempted
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 text-zinc-400 dark:text-zinc-600'
              )}
              title={problem.isSolved ? 'Solved' : problem.isAttempted ? 'Attempted' : 'Unsolved'}
            >
              {problem.isSolved ? '✓' : problem.isAttempted ? '!' : '○'}
            </div>

            <h3 className="font-jetbrains text-sm font-bold text-zinc-900 dark:text-white transition-colors">
              {problem.title}
            </h3>
          </div>

          <DifficultyBadge difficulty={problem.difficulty} />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
          {problem.tags.map((tag) => (
            <span
              key={tag}
<<<<<<< HEAD
              className="font-jetbrains text-[0.65rem] text-zinc-400 bg-zinc-900/60 border border-zinc-800 px-2.5 py-0.5 rounded-md"
=======
              className="font-jetbrains text-[0.65rem] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 px-2.5 py-0.5 rounded"
>>>>>>> 1ac750ce303750f74a1d94c81eb62bf168acf045
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Meta Row: Acceptance % + Points */}
      <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-3 text-[0.7rem] text-zinc-500 font-jetbrains">
        <div className="flex items-center gap-1.5">
          <span>Acceptance:</span>
          <span className="font-bold text-zinc-700 dark:text-zinc-300">{problem.acceptanceRate}%</span>
        </div>
        <div className="flex items-center gap-1.5">
<<<<<<< HEAD
          <span className="text-blue-400 font-bold">+{problem.points} PTS</span>
=======
          <span className="text-blue-600 dark:text-blue-400 font-extrabold">+{problem.points} PTS</span>
>>>>>>> 1ac750ce303750f74a1d94c81eb62bf168acf045
        </div>
      </div>
    </Link>
  );
};
