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
<<<<<<< HEAD
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
=======
    <div className="font-inter flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md px-4 py-2 transition-colors">
      {/* Language Selector + Autosave indicator */}
      <div className="flex items-center gap-4">
        <div className="relative group">
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="appearance-none rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 pl-3 pr-8 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
          >
            <option value="cpp">C++ 20 (GCC)</option>
            <option value="python">Python 3.11</option>
            <option value="java">Java 17</option>
            <option value="javascript">JavaScript (Node)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500 group-focus-within:text-blue-500 transition-colors">
            <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
>>>>>>> f4becec8226ca9317ff9585eedcc5ba1074cda1d

        <AutosaveIndicator lastSavedAt={lastSavedAt} />
      </div>

<<<<<<< HEAD
      {/* Buttons with deliberate visual weight difference & separation (Fitts's Law) */}
      <div className="flex items-center gap-3">
        <button
          onClick={onReset}
          disabled={isStreaming}
          className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 transition-colors"
=======
      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          disabled={isStreaming}
          title="Reset code to starter template"
          className="text-[0.7rem] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
>>>>>>> f4becec8226ca9317ff9585eedcc5ba1074cda1d
        >
          Reset
        </button>

<<<<<<< HEAD
        {/* RUN: Secondary/Neutral styling, low visual weight */}
        <button
          onClick={onRun}
          disabled={isStreaming}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-750 hover:border-slate-600 transition-all duration-150 disabled:opacity-50"
        >
          <svg className="h-3.5 w-3.5 fill-current text-slate-400" viewBox="0 0 24 24">
=======
        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />

        {/* Run */}
        <button
          onClick={onRun}
          disabled={isStreaming}
          title="Run code (Ctrl + Enter)"
          className="group flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all disabled:opacity-50"
        >
          <svg className="h-3 w-3 fill-current text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
>>>>>>> f4becec8226ca9317ff9585eedcc5ba1074cda1d
            <path d="M8 5v14l11-7z" />
          </svg>
          <span>Run</span>
          <kbd className="hidden lg:inline-block text-[0.6rem] font-mono text-zinc-400 dark:text-zinc-500 ml-0.5">
            Ctrl ↵
          </kbd>
        </button>

<<<<<<< HEAD
        {/* SUBMIT: Primary cyan, larger, clearly separated — High stakes moment */}
        <button
          onClick={onSubmit}
          disabled={isStreaming}
          className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-6 py-2 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 hover:bg-cyan-400 hover:shadow-cyan-400/30 transition-all duration-150 transform hover:-translate-y-0.5 disabled:opacity-50"
=======
        {/* Submit */}
        <button
          onClick={onSubmit}
          disabled={isStreaming}
          title="Submit solution (Ctrl + Shift + Enter)"
          className="group flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-1.5 text-xs font-semibold text-white transition-all disabled:opacity-50"
>>>>>>> f4becec8226ca9317ff9585eedcc5ba1074cda1d
        >
          <svg className="h-3.5 w-3.5 stroke-current group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
          <span>Submit</span>
        </button>
      </div>
    </div>
  );
};
