import React from 'react';
import { Problem } from '@/types';
import { DifficultyBadge } from '@/components/ui/DifficultyBadge';

interface ProblemStatementProps {
  problem: Problem;
}

export const ProblemStatement: React.FC<ProblemStatementProps> = ({ problem }) => {
  return (
<<<<<<< HEAD
    <div className="h-full overflow-y-auto p-6 font-sans text-slate-200">
      {/* Title & Metadata Header */}
      <div className="border-b border-slate-800 pb-5 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-jetbrains text-2xl font-extrabold text-slate-100">
=======
    <div className="h-full overflow-y-auto p-6 font-inter text-zinc-800 dark:text-zinc-200 transition-colors duration-150">
      {/* Title & Metadata Header */}
      <div className="border-b border-zinc-200/60 dark:border-zinc-800/60 pb-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
>>>>>>> f4becec8226ca9317ff9585eedcc5ba1074cda1d
            {problem.title}
          </h1>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>

<<<<<<< HEAD
        <div className="flex flex-wrap items-center gap-4 font-jetbrains text-xs text-slate-400">
          <div>Time Limit: <span className="text-slate-200">{problem.timeLimitMs}ms</span></div>
          <div>Memory Limit: <span className="text-slate-200">{problem.memoryLimitMb}MB</span></div>
          <div>Points: <span className="text-cyan-400 font-bold">{problem.points}</span></div>
          <div>Acceptance: <span className="text-slate-200">{problem.acceptanceRate}%</span></div>
=======
        <div className="flex flex-wrap items-center gap-3 text-[0.68rem] font-medium text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5 bg-zinc-100/50 dark:bg-zinc-900/50 px-2 py-1 rounded-md border border-zinc-200/50 dark:border-zinc-800/50">
            Time: <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{problem.timeLimitMs}ms</span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-100/50 dark:bg-zinc-900/50 px-2 py-1 rounded-md border border-zinc-200/50 dark:border-zinc-800/50">
            Memory: <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{problem.memoryLimitMb}MB</span>
          </div>
          <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-800/50">
            Points: <span className="text-blue-700 dark:text-blue-400 font-bold">{problem.points}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-100/50 dark:bg-zinc-900/50 px-2 py-1 rounded-md border border-zinc-200/50 dark:border-zinc-800/50">
            Acceptance: <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{problem.acceptanceRate}%</span>
          </div>
>>>>>>> f4becec8226ca9317ff9585eedcc5ba1074cda1d
        </div>
      </div>

      {/* Problem Description Body */}
<<<<<<< HEAD
      <div className="space-y-6 text-sm leading-relaxed text-slate-300">
        <div>
          <h3 className="font-jetbrains text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Description
          </h3>
          <p className="whitespace-pre-line">{problem.description}</p>
        </div>

        <div>
          <h3 className="font-jetbrains text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Input Format
          </h3>
          <p className="whitespace-pre-line bg-slate-900/50 p-3 rounded-lg border border-slate-800 font-mono text-xs">
            {problem.inputFormat}
          </p>
        </div>

        <div>
          <h3 className="font-jetbrains text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Output Format
          </h3>
          <p className="whitespace-pre-line bg-slate-900/50 p-3 rounded-lg border border-slate-800 font-mono text-xs">
            {problem.outputFormat}
          </p>
        </div>

        {/* Sample Test Cases */}
        {problem.sampleTestCases.map((sample, idx) => (
          <div key={sample.id} className="space-y-3">
            <h3 className="font-jetbrains text-xs font-bold uppercase tracking-wider text-slate-400">
              Sample Case #{idx + 1}
            </h3>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <span className="font-jetbrains text-[0.7rem] text-slate-500 uppercase block mb-1">
                  Sample Input
                </span>
                <pre className="font-jetbrains bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-200 overflow-x-auto">
                  {sample.input}
                </pre>
              </div>

              <div>
                <span className="font-jetbrains text-[0.7rem] text-slate-500 uppercase block mb-1">
                  Expected Output
                </span>
                <pre className="font-jetbrains bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-emerald-400 overflow-x-auto">
                  {sample.expectedOutput}
                </pre>
=======
      <div className="space-y-6 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
        <div>
          <p className="whitespace-pre-line text-[0.9rem]">{problem.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <h3 className="text-[0.62rem] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Input Format
            </h3>
            <p className="whitespace-pre-line bg-zinc-50 dark:bg-zinc-900/80 p-3.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 font-mono text-xs text-zinc-800 dark:text-zinc-300 leading-relaxed">
              {problem.inputFormat}
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-[0.62rem] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Output Format
            </h3>
            <p className="whitespace-pre-line bg-zinc-50 dark:bg-zinc-900/80 p-3.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 font-mono text-xs text-zinc-800 dark:text-zinc-300 leading-relaxed">
              {problem.outputFormat}
            </p>
          </div>
        </div>

        {/* Sample Test Cases */}
        <div className="space-y-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Sample Cases
          </h3>
          
          {problem.sampleTestCases.map((sample, idx) => (
            <div key={sample.id} className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 space-y-3">
              <h4 className="text-[0.62rem] font-semibold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase">
                Example {idx + 1}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[0.6rem] font-semibold text-zinc-400 uppercase tracking-wider block">
                    Input
                  </span>
                  <pre className="font-mono bg-white dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-300 overflow-x-auto select-all">
                    {sample.input}
                  </pre>
                </div>

                <div className="space-y-1">
                  <span className="text-[0.6rem] font-semibold text-emerald-500 uppercase tracking-wider block">
                    Output
                  </span>
                  <pre className="font-mono bg-white dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-emerald-600 dark:text-emerald-400 overflow-x-auto select-all">
                    {sample.expectedOutput}
                  </pre>
                </div>
>>>>>>> f4becec8226ca9317ff9585eedcc5ba1074cda1d
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
