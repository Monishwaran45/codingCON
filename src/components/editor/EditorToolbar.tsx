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
    <div className="font-jetbrains flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950 px-4 py-2 transition-colors">
      {/* Language Selector + Autosave info */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:border-blue-500 focus:outline-none shadow-xs"
          >
            <option value="cpp">C++ 20 (GCC 12.2)</option>
            <option value="python">Python 3.11 (CPython)</option>
            <option value="java">Java 17 (OpenJDK)</option>
            <option value="javascript">JavaScript (Node.js 18)</option>
          </select>
        </div>
=======
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
>>>>>>> f4ea211f46724849dff0a0455c065cbfa4e882f5

        <AutosaveIndicator lastSavedAt={lastSavedAt} />
      </div>

<<<<<<< HEAD
      {/* Buttons & Shortcut hints */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          disabled={isStreaming}
          className="text-[0.7rem] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 px-2 py-1 transition-colors disabled:opacity-50"
          title="Reset code template"
=======
      {/* Buttons with standard assessment styling */}
      <div className="flex items-center gap-3">
        <button
          onClick={onReset}
          disabled={isStreaming}
          className="text-xs text-zinc-500 hover:text-zinc-350 px-2 py-1 transition-colors"
>>>>>>> f4ea211f46724849dff0a0455c065cbfa4e882f5
        >
          Reset Code
        </button>

<<<<<<< HEAD
        {/* RUN: Secondary action with Ctrl+Enter shortcut tag */}
        <button
          onClick={onRun}
          disabled={isStreaming}
          className="group flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-all duration-150 disabled:opacity-50 shadow-xs"
          title="Shortcut: Ctrl + Enter"
        >
          <svg className="h-3 w-3 fill-current text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24">
=======
        {/* RUN: Secondary action */}
        <button
          onClick={onRun}
          disabled={isStreaming}
          className="flex items-center gap-1.5 rounded-md border border-zinc-850 bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-all duration-150 disabled:opacity-50"
        >
          <svg className="h-3.5 w-3.5 fill-current text-zinc-400" viewBox="0 0 24 24">
>>>>>>> f4ea211f46724849dff0a0455c065cbfa4e882f5
            <path d="M8 5v14l11-7z" />
          </svg>
          <span>Run</span>
          <kbd className="hidden sm:inline-block text-[0.6rem] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1 rounded border border-zinc-200 dark:border-zinc-700">
            Ctrl ↵
          </kbd>
        </button>

<<<<<<< HEAD
        {/* SUBMIT: Primary Blue action with Ctrl+Shift+Enter */}
        <button
          onClick={onSubmit}
          disabled={isStreaming}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-all duration-150 disabled:opacity-50 shadow-xs"
          title="Shortcut: Ctrl + Shift + Enter"
=======
        {/* SUBMIT: Primary Blue action */}
        <button
          onClick={onSubmit}
          disabled={isStreaming}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-6 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-all duration-150 disabled:opacity-50"
>>>>>>> f4ea211f46724849dff0a0455c065cbfa4e882f5
        >
          <svg className="h-3.5 w-3.5 stroke-current" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
          <span>Submit Solution</span>
        </button>
      </div>
    </div>
  );
};

