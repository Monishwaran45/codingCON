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
    <div className="font-jetbrains flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950 px-4 py-2.5">
      {/* Language Selector + Autosave info */}
      <div className="flex items-center gap-4">
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
        >
          <option value="cpp">C++ 20 (GCC 12.2)</option>
          <option value="python">Python 3.11</option>
          <option value="java">Java 17 (OpenJDK)</option>
          <option value="javascript">JavaScript (Node.js 18)</option>
        </select>

        <AutosaveIndicator lastSavedAt={lastSavedAt} />
      </div>

      {/* Buttons with deliberate visual weight difference & separation (Fitts's Law) */}
      <div className="flex items-center gap-3">
        <button
          onClick={onReset}
          disabled={isStreaming}
          className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 transition-colors"
        >
          Reset Code
        </button>

        {/* RUN: Secondary/Neutral styling, low visual weight */}
        <button
          onClick={onRun}
          disabled={isStreaming}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-750 hover:border-slate-600 transition-all duration-150 disabled:opacity-50"
        >
          <svg className="h-3.5 w-3.5 fill-current text-slate-400" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Run Code
        </button>

        {/* SUBMIT: Primary cyan, larger, clearly separated — High stakes moment */}
        <button
          onClick={onSubmit}
          disabled={isStreaming}
          className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-6 py-2 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 hover:bg-cyan-400 hover:shadow-cyan-400/30 transition-all duration-150 transform hover:-translate-y-0.5 disabled:opacity-50"
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
