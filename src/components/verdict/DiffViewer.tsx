'use client';

import React, { useState } from 'react';
import { TestCaseResult } from '@/types';

interface DiffViewerProps {
  failedTestCase: TestCaseResult;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ failedTestCase }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="font-jetbrains rounded-md border border-red-500/25 bg-red-950/15 p-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-red-400 font-semibold">
          Failed on Test Case #{failedTestCase.id}
        </span>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300 hover:bg-red-500/20 transition-colors"
        >
          {isOpen ? 'Hide Diff' : 'View Diff'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-red-500/15 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <span className="text-zinc-400 block mb-1">Expected Output:</span>
              <pre className="bg-zinc-950 p-2.5 rounded-md border border-zinc-800 text-emerald-400 overflow-x-auto">
                {failedTestCase.expectedOutput || '(empty)'}
              </pre>
            </div>

            <div>
              <span className="text-zinc-400 block mb-1">Your Output:</span>
              <pre className="bg-zinc-950 p-2.5 rounded-md border border-red-500/30 text-red-400 overflow-x-auto">
                {failedTestCase.actualOutput || '(empty)'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
