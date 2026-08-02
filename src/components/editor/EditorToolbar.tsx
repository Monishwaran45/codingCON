'use client';

import React from 'react';
import { AutosaveIndicator } from './AutosaveIndicator';

interface EditorToolbarProps {
  language: string;
  onLanguageChange: (lang: string) => void;
  onReset: () => void;
  onRun: () => void;
  onSubmit: () => void;
  isStreaming: boolean;
  lastSavedAt: string | null;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  language,
  onLanguageChange,
  onReset,
  onRun,
  onSubmit,
  isStreaming,
  lastSavedAt,
}) => {
  return (
    <div className="font-jetbrains flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950 px-4 py-2">
      {/* Language Selector + Autosave info */}
      <div className="flex items-center gap-4">
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 focus:border-zinc-750 focus:outline-none"
        >
          <option value="cpp">C++ 20 (GCC 12.2)</option>
          <option value="python">Python 3.11</option>
          <option value="java">Java 17 (OpenJDK)</option>
          <option value="javascript">JavaScript (Node.js 18)</option>
        </select>

        <AutosaveIndicator lastSavedAt={lastSavedAt} />
      </div>

      {/* Buttons with standard assessment styling */}
      <div className="flex items-center gap-3">
        <button
          onClick={onReset}
          disabled={isStreaming}
          className="text-xs text-zinc-500 hover:text-zinc-350 px-2 py-1 transition-colors"
        >
          Reset Code
        </button>

        {/* RUN: Secondary action */}
        <button
          onClick={onRun}
          disabled={isStreaming}
          className="flex items-center gap-1.5 rounded-md border border-zinc-850 bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-all duration-150 disabled:opacity-50"
        >
          <svg className="h-3.5 w-3.5 fill-current text-zinc-400" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Run Code
        </button>

        {/* SUBMIT: Primary Blue action */}
        <button
          onClick={onSubmit}
          disabled={isStreaming}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-6 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-all duration-150 disabled:opacity-50"
        >
          <svg className="h-3.5 w-3.5 stroke-current" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
          Submit Solution
        </button>
      </div>
    </div>
  );
};
