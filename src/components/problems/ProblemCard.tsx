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
      className="group relative flex flex-col justify-between rounded-xl border border-zinc-900 bg-zinc-950 p-5 hover:border-zinc-700 hover:bg-zinc-900/40 transition-all duration-150 shadow-md"
    >
      <div>
        {/* Top Header Row: Status icon + Title + Difficulty */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            {/* Zeigarnik Effect: Filled checkmark vs Empty circle directly on card */}
            <div
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-bold text-xs font-jetbrains',
                problem.isSolved
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                  : problem.isAttempted
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-600'
              )}
              title={problem.isSolved ? 'Solved' : problem.isAttempted ? 'Attempted' : 'Unsolved'}
            >
              {problem.isSolved ? '✓' : problem.isAttempted ? '!' : '○'}
            </div>

            <h3 className="font-jetbrains text-sm font-bold text-white transition-colors">
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
              className="font-jetbrains text-[0.65rem] text-zinc-400 bg-zinc-900/60 border border-zinc-800 px-2.5 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Meta Row: Acceptance % + Points */}
      <div className="flex items-center justify-between border-t border-zinc-900 pt-3 text-[0.7rem] text-zinc-500 font-jetbrains">
        <div className="flex items-center gap-1.5">
          <span>Acceptance:</span>
          <span className="font-bold text-zinc-300">{problem.acceptanceRate}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-cyan-400 font-extrabold">+{problem.points} PTS</span>
        </div>
      </div>
    </Link>
  );
};
