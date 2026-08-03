'use client';

import React, { useState } from 'react';

interface CustomInputPanelProps {
  onRunCustomInput: (input: string) => void;
  isStreaming: boolean;
  customOutput?: string;
}

export const CustomInputPanel: React.FC<CustomInputPanelProps> = ({
  onRunCustomInput,
  isStreaming,
  customOutput,
}) => {
  const [customInput, setCustomInput] = useState('');

  return (
    <div className="space-y-3 font-inter text-xs">
      <div>
        <label className="text-[0.62rem] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
          Custom Input (stdin)
        </label>
        <textarea
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Enter test input line by line..."
          rows={3}
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2.5 font-mono text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all resize-none"
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => onRunCustomInput(customInput)}
          disabled={isStreaming}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold px-3.5 py-1.5 text-xs transition-colors disabled:opacity-50"
        >
          <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          {isStreaming ? 'Executing...' : 'Run'}
        </button>
        <span className="text-[0.62rem] text-zinc-400">
          Executes code against custom input
        </span>
      </div>

      {customOutput !== undefined && (
        <div>
          <span className="text-[0.62rem] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
            Output (stdout)
          </span>
          <pre className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-mono text-xs text-emerald-600 dark:text-emerald-400 overflow-x-auto">
            {customOutput || '(No output)'}
          </pre>
        </div>
      )}
    </div>
  );
};
