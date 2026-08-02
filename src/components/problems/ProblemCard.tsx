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
      className="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-cyan-500/50 hover:bg-slate-900/90 transition-all duration-150 shadow-lg hover:shadow-cyan-500/5"
    >
      <div>
        {/* Top Header Row: Status icon + Title + Difficulty */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            {/* Zeigarnik Effect: Filled checkmark vs Empty circle directly on card */}
            <div
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-bold text-xs',
                problem.isSolved
                  ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400'
                  : problem.isAttempted
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                  : 'border-slate-700 bg-slate-800/50 text-slate-600'
              )}
              title={problem.isSolved ? 'Solved' : problem.isAttempted ? 'Attempted' : 'Unsolved'}
            >
              {problem.isSolved ? '✓' : problem.isAttempted ? '!' : '○'}
            </div>

            <h3 className="font-jetbrains text-sm font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
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
              className="font-jetbrains text-[0.65rem] text-slate-400 bg-slate-800/80 border border-slate-800 px-2 py-0.5 rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Meta Row: Acceptance % + Points */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs text-slate-400 font-jetbrains">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Acceptance:</span>
          <span className="font-semibold text-slate-200">{problem.acceptanceRate}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-cyan-400 font-semibold">+{problem.points} pts</span>
        </div>
      </div>
    </Link>
  );
};
