'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Difficulty } from '@/types';
import { api } from '@/lib/api';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

interface EditableTestCase {
  id?: string | number;
  input: string;
  expectedOutput: string;
  isSample: boolean;
}

export default function EditProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const problemId = resolvedParams.id;
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [points, setPoints] = useState(100);
  const [timeLimitMs, setTimeLimitMs] = useState(1000);
  const [memoryLimitMb, setMemoryLimitMb] = useState(256);
  const [tagsInput, setTagsInput] = useState('');
  const [description, setDescription] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [testCases, setTestCases] = useState<EditableTestCase[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const problem = await api.getAdminProblemById(problemId);
        setTitle(problem.title);
        setDifficulty(problem.difficulty);
        setPoints(problem.points);
        setTimeLimitMs(problem.timeLimitMs);
        setMemoryLimitMb(problem.memoryLimitMb);
        setTagsInput(problem.tags.join(', '));
        setDescription(problem.description);
        setInputFormat(problem.inputFormat || '');
        setOutputFormat(problem.outputFormat || '');
        setTestCases(
          problem.allTestCases.map((tc) => ({
            id: tc.id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isSample: tc.isSample,
          }))
        );
      } catch {
        setErrorMessage('Failed to load problem details.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [problemId]);

  const addTestCase = (isSample: boolean) => {
    setTestCases((prev) => [
      ...prev,
      { input: '', expectedOutput: '', isSample },
    ]);
  };

  const updateTestCase = (index: number, field: 'input' | 'expectedOutput', value: string) => {
    setTestCases((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeTestCase = (index: number) => {
    setTestCases((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMessage('Title and description are required.');
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      await api.updateProblem(problemId, {
        title: title.trim(),
        difficulty,
        points: Number(points),
        timeLimitMs: Number(timeLimitMs),
        memoryLimitMb: Number(memoryLimitMb),
        tags,
        description: description.trim(),
        inputFormat: inputFormat.trim(),
        outputFormat: outputFormat.trim(),
        testCases,
      });
      setSuccessMessage('Problem updated successfully.');
      setTimeout(() => router.push('/admin'), 1200);
    } catch {
      setErrorMessage('Failed to update problem. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const field =
    'w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all';

  const label = 'text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5';

  if (isLoading) {
    return (
      <AdminGuard>
        <div className="mx-auto max-w-4xl p-8 space-y-4">
          <SkeletonLoader count={6} className="h-14 w-full rounded-xl" />
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="mx-auto max-w-4xl px-4 py-8 font-inter">
        {/* Header */}
        <div className="mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-5 flex items-center justify-between">
          <div>
            <span className="text-[0.62rem] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-1">
              Admin Console
            </span>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Edit Problem Details
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Update statement, points, timeout limits, and test cases.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Status messages */}
        {successMessage && (
          <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <span>✓</span> {successMessage} Redirecting...
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs font-semibold text-red-600 dark:text-red-400">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Metadata */}
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 space-y-4">
            <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Problem Metadata & Constraints
            </h2>

            <div>
              <label className={label}>Problem Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={field}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={label}>Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className={field}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className={label}>Points</label>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  min={0}
                  required
                  className={field}
                />
              </div>
              <div>
                <label className={label}>Time Limit / Timeout (ms)</label>
                <input
                  type="number"
                  value={timeLimitMs}
                  onChange={(e) => setTimeLimitMs(Number(e.target.value))}
                  min={100}
                  required
                  className={field}
                />
              </div>
              <div>
                <label className={label}>Memory Limit (MB)</label>
                <input
                  type="number"
                  value={memoryLimitMb}
                  onChange={(e) => setMemoryLimitMb(Number(e.target.value))}
                  min={16}
                  required
                  className={field}
                />
              </div>
            </div>

            <div>
              <label className={label}>Tags (comma-separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className={field}
              />
            </div>
          </section>

          {/* Statement */}
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 space-y-4">
            <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Problem Description & Formats
            </h2>

            <div>
              <label className={label}>Description *</label>
              <textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className={field + ' resize-y'}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={label}>Input Format</label>
                <textarea
                  rows={3}
                  value={inputFormat}
                  onChange={(e) => setInputFormat(e.target.value)}
                  className={field + ' resize-y font-mono text-xs'}
                />
              </div>
              <div>
                <label className={label}>Output Format</label>
                <textarea
                  rows={3}
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  className={field + ' resize-y font-mono text-xs'}
                />
              </div>
            </div>
          </section>

          {/* Test Cases */}
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Test Cases ({testCases.length})
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addTestCase(true)}
                  className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors"
                >
                  + Sample Case
                </button>
                <button
                  type="button"
                  onClick={() => addTestCase(false)}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  + Hidden Evaluation Case
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {testCases.map((tc, index) => (
                <div key={index} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-zinc-500">
                      Test #{index + 1} —{' '}
                      <span className={tc.isSample ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400'}>
                        {tc.isSample ? 'Sample Case (Visible to students)' : 'Hidden Evaluation Case'}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeTestCase(index)}
                      className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[0.62rem] uppercase tracking-wider text-zinc-500 block mb-1">Input</label>
                      <textarea
                        rows={3}
                        value={tc.input}
                        onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:outline-none resize-y"
                      />
                    </div>
                    <div>
                      <label className="text-[0.62rem] uppercase tracking-wider text-zinc-500 block mb-1">Expected Output</label>
                      <textarea
                        rows={3}
                        value={tc.expectedOutput}
                        onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:outline-none resize-y"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-5 py-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 hover:bg-blue-500 px-8 py-2.5 text-xs font-bold text-white transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Problem Changes'}
            </button>
          </div>
        </form>
      </div>
    </AdminGuard>
  );
}
