import React from 'react';
import { Problem } from '@/types';
import { DifficultyBadge } from '@/components/ui/DifficultyBadge';

interface ProblemStatementProps {
  problem: Problem;
}

export const ProblemStatement: React.FC<ProblemStatementProps> = ({ problem }) => {
  return (
    <div className="h-full overflow-y-auto p-6 font-sans text-slate-200">
      {/* Title & Metadata Header */}
      <div className="border-b border-slate-800 pb-5 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-jetbrains text-2xl font-extrabold text-slate-100">
            {problem.title}
          </h1>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>

        <div className="flex flex-wrap items-center gap-4 font-jetbrains text-xs text-slate-400">
          <div>Time Limit: <span className="text-slate-200">{problem.timeLimitMs}ms</span></div>
          <div>Memory Limit: <span className="text-slate-200">{problem.memoryLimitMb}MB</span></div>
          <div>Points: <span className="text-cyan-400 font-bold">{problem.points}</span></div>
          <div>Acceptance: <span className="text-slate-200">{problem.acceptanceRate}%</span></div>
        </div>
      </div>

      {/* Problem Description Body */}
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
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
