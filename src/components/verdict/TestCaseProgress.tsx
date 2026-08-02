import React from 'react';
import { TestCaseResult } from '@/types';

interface TestCaseProgressProps {
  passedTestCases: number;
  totalTestCases: number;
  results: TestCaseResult[];
  isStreaming: boolean;
}

export const TestCaseProgress: React.FC<TestCaseProgressProps> = ({
  passedTestCases,
  totalTestCases,
  results,
  isStreaming,
}) => {
  const percent = totalTestCases > 0 ? Math.round((passedTestCases / totalTestCases) * 100) : 0;

  return (
    <div className="font-jetbrains space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {isStreaming && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
          )}
          <span className="font-medium text-zinc-200">
            {isStreaming ? `Evaluating (${passedTestCases}/${totalTestCases})` : 'Test Results'}
          </span>
        </div>
        <span className="text-blue-400 font-semibold">{percent}%</span>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Test Case Badges */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {results.map((res) => (
          <span
            key={res.id}
            className={`text-[0.65rem] font-semibold px-2 py-0.5 rounded-md border ${
              res.passed
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/15 text-red-400 border-red-500/30'
            }`}
          >
            TC #{res.id} {res.passed ? '✓' : '✗'}
          </span>
        ))}
      </div>
    </div>
  );
};
