'use client';

import React, { useState } from 'react';
import { TestCaseResult } from '@/types';

interface DiffViewerProps {
  failedTestCase: TestCaseResult;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ failedTestCase }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasError = !!failedTestCase.error;

  return (
    <div className="font-jetbrains rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-red-400 font-bold">Failed on Test Case #{failedTestCase.id}</span>
        </div>

        {/* Action: Immediately surface "View diff" or "View Error" */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition-colors"
        >
          {isOpen ? 'Hide Details' : hasError ? 'View Error' : 'View Diff'}
        </button>
      </div>

      {/* Collapsible Error or Expected vs Actual comparison */}
      {isOpen && (
        <div className="mt-4 pt-3 border-t border-red-500/20 space-y-3">
          {hasError ? (
            <div>
              <span className="text-red-400 block mb-1 font-bold">Error Message:</span>
              <pre className="bg-slate-950 p-2.5 rounded border border-red-500/40 text-red-400 overflow-x-auto whitespace-pre-wrap">
                {failedTestCase.error}
              </pre>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <span className="text-slate-400 block mb-1">Expected Output:</span>
                <pre className="bg-slate-950 p-2.5 rounded border border-slate-800 text-emerald-400 overflow-x-auto">
                  {failedTestCase.expectedOutput || '(empty)'}
                </pre>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Your Output:</span>
                <pre className="bg-slate-950 p-2.5 rounded border border-red-500/40 text-red-400 overflow-x-auto">
                  {failedTestCase.actualOutput || '(empty)'}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
