'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';

interface ProblemImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProblemImportModal({ isOpen, onClose, onSuccess }: ProblemImportModalProps) {
  const [jsonText, setJsonText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState(0);

  if (!isOpen) return null;

  const sampleTemplate = [
    {
      title: "Two Sum",
      difficulty: "easy",
      points: 100,
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      tags: ["Arrays", "Hash Table"],
      description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
      inputFormat: "First line contains N and Target. Second line contains N integers.",
      outputFormat: "Print two 0-indexed indices.",
      testCases: [
        { input: "4 9\n2 7 11 15", expectedOutput: "0 1", isSample: true },
        { input: "3 6\n3 2 4", expectedOutput: "1 2", isSample: false }
      ]
    }
  ];

  const handleFillTemplate = () => {
    setJsonText(JSON.stringify(sampleTemplate, null, 2));
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonText.trim()) return;

    setIsSubmitting(true);
    setError('');
    setSuccessCount(0);

    try {
      const parsed = JSON.parse(jsonText);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      let count = 0;
      for (const item of items) {
        if (!item.title || !item.description) continue;
        await api.createProblem({
          title: item.title,
          difficulty: item.difficulty || 'medium',
          points: Number(item.points) || 100,
          timeLimitMs: Number(item.timeLimitMs) || 1000,
          memoryLimitMb: Number(item.memoryLimitMb) || 256,
          tags: Array.isArray(item.tags) ? item.tags : [],
          description: item.description,
          inputFormat: item.inputFormat || '',
          outputFormat: item.outputFormat || '',
          testCases: item.testCases || item.sampleTestCases || [],
        });
        count++;
      }

      setSuccessCount(count);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Invalid JSON format or import failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-4">
          <div>
            <span className="text-[0.62rem] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block">
              Batch Problem Upload
            </span>
            <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
              Import Problems via JSON
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg font-bold"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {successCount > 0 && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            ✓ Successfully imported {successCount} problem(s)!
          </div>
        )}

        <form onSubmit={handleImport} className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Paste JSON Data (Single Object or Array)
            </label>
            <button
              type="button"
              onClick={handleFillTemplate}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Load Sample Format
            </button>
          </div>

          <textarea
            rows={10}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={`[\n  {\n    "title": "Problem Title",\n    "difficulty": "medium",\n    "timeLimitMs": 1000,\n    ...\n  }\n]`}
            required
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 p-3.5 font-mono text-xs text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none resize-y"
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !jsonText.trim()}
              className="rounded-lg bg-blue-600 hover:bg-blue-500 px-6 py-2 text-xs font-bold text-white transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Uploading...' : 'Import & Publish Problems'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
