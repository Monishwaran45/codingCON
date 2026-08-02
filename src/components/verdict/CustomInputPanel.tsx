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
    <div className="space-y-3 font-jetbrains text-xs">
      <div>
        <label className="text-[0.65rem] font-bold text-zinc-500 uppercase block mb-1">
          Custom Test STDIN Input:
        </label>
        <textarea
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Paste or type test input values line-by-line..."
          rows={3}
          className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2.5 font-mono text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => onRunCustomInput(customInput)}
          disabled={isStreaming}
          className="rounded bg-zinc-800 dark:bg-zinc-200 hover:bg-zinc-700 dark:hover:bg-zinc-300 text-white dark:text-zinc-900 font-bold px-3 py-1 text-xs transition-colors disabled:opacity-50"
        >
          {isStreaming ? 'Executing...' : 'Run with Custom Input'}
        </button>
        <span className="text-[0.65rem] text-zinc-400">
          Will execute code against custom STDIN payload
        </span>
      </div>

      {customOutput !== undefined && (
        <div>
          <span className="text-[0.65rem] font-bold text-zinc-500 uppercase block mb-1">
            Program Output (STDOUT):
          </span>
          <pre className="p-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 font-mono text-xs text-emerald-600 dark:text-emerald-400 overflow-x-auto">
            {customOutput || '(No stdout produced)'}
          </pre>
        </div>
      )}
    </div>
  );
};
