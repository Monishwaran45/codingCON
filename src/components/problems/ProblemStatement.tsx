import React from 'react';
import { Problem } from '@/types';
import { DifficultyBadge } from '@/components/ui/DifficultyBadge';

interface ProblemStatementProps {
  problem: Problem;
}

export const ProblemStatement: React.FC<ProblemStatementProps> = ({ problem }) => {
  return (
    <div className="h-full overflow-y-auto p-6 font-sans text-zinc-800 dark:text-zinc-200 transition-colors duration-150">
      {/* Title & Metadata Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-5">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-jetbrains text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {problem.title}
          </h1>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>

        <div className="flex flex-wrap items-center gap-4 font-jetbrains text-xs text-zinc-500 dark:text-zinc-400">
          <div>Time Limit: <span className="text-zinc-800 dark:text-zinc-200">{problem.timeLimitMs}ms</span></div>
          <div>Memory Limit: <span className="text-zinc-800 dark:text-zinc-200">{problem.memoryLimitMb}MB</span></div>
          <div>Points: <span className="text-blue-600 dark:text-blue-400 font-semibold">{problem.points}</span></div>
          <div>Acceptance: <span className="text-zinc-800 dark:text-zinc-200">{problem.acceptanceRate}%</span></div>
        </div>
      </div>

      {/* Problem Description Body */}
      <div className="space-y-5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <div>
          <h3 className="font-jetbrains text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            Description
          </h3>
          <p className="whitespace-pre-line">{problem.description}</p>
        </div>

        <div>
          <h3 className="font-jetbrains text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            Input Format
          </h3>
          <p className="whitespace-pre-line bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-md border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-zinc-800 dark:text-zinc-200">
            {problem.inputFormat}
          </p>
        </div>

        <div>
          <h3 className="font-jetbrains text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            Output Format
          </h3>
          <p className="whitespace-pre-line bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-md border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-zinc-800 dark:text-zinc-200">
            {problem.outputFormat}
          </p>
        </div>

        {/* Sample Test Cases */}
        {problem.sampleTestCases.map((sample, idx) => (
          <div key={sample.id} className="space-y-2">
            <h3 className="font-jetbrains text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Sample Case #{idx + 1}
            </h3>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <span className="font-jetbrains text-[0.7rem] text-zinc-500 uppercase block mb-1">
                  Input
                </span>
                <pre className="font-jetbrains bg-zinc-100 dark:bg-zinc-950 p-3 rounded-md border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 overflow-x-auto">
                  {sample.input}
                </pre>
              </div>

              <div>
                <span className="font-jetbrains text-[0.7rem] text-zinc-500 uppercase block mb-1">
                  Expected Output
                </span>
                <pre className="font-jetbrains bg-zinc-100 dark:bg-zinc-950 p-3 rounded-md border border-zinc-200 dark:border-zinc-800 text-xs text-emerald-600 dark:text-emerald-400 overflow-x-auto">
                  {sample.expectedOutput}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
