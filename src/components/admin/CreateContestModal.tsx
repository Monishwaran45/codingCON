'use client';

import React, { useState } from 'react';
import { Problem } from '@/types';
import { api } from '@/lib/api';

interface CreateContestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableProblems: Problem[];
}

export function CreateContestModal({
  isOpen,
  onClose,
  onSuccess,
  availableProblems,
}: CreateContestModalProps) {
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleProblem = (id: string) => {
    setSelectedProblemIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Contest title is required.');
      return;
    }
    if (selectedProblemIds.length === 0) {
      setError('Select at least one problem for the contest.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const now = new Date();
      const startTime = now.toISOString();
      const endTime = new Date(now.getTime() + durationMinutes * 60 * 1000).toISOString();

      await api.createContest({
        title: title.trim(),
        startTime,
        endTime,
        durationMinutes: Number(durationMinutes),
        problemIds: selectedProblemIds,
      });

      onSuccess();
      onClose();
    } catch {
      setError('Failed to create contest. Please check details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-4">
          <div>
            <span className="text-[0.62rem] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block">
              Contest Management
            </span>
            <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
              Schedule & Start Contest
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
              Contest Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly Coding Contest #42"
              required
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                Duration Timeout (Minutes)
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                min={15}
                max={480}
                required
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                Status
              </label>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Starts Immediately
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
              Select Problems for Contest ({selectedProblemIds.length} chosen)
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 bg-zinc-50/50 dark:bg-zinc-900/40">
              {availableProblems.length === 0 ? (
                <p className="text-xs text-zinc-500 p-4 text-center">No problems available. Create problems first.</p>
              ) : (
                availableProblems.map((prob) => {
                  const isChecked = selectedProblemIds.includes(prob.id);
                  return (
                    <div
                      key={prob.id}
                      onClick={() => toggleProblem(prob.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-blue-500 bg-blue-500/10 text-blue-900 dark:text-blue-200'
                          : 'border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs font-semibold">{prob.title}</span>
                      </div>
                      <span className="text-[0.65rem] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                        {prob.points} pts | {prob.timeLimitMs}ms
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-900">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 hover:bg-blue-500 px-6 py-2 text-xs font-bold text-white transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Contest...' : 'Publish & Start Contest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
