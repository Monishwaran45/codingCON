'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Difficulty, TestCase } from '@/types';
import { api } from '@/lib/api';
import { AdminGuard } from '@/components/admin/AdminGuard';

export default function CreateProblemPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [points, setPoints] = useState(100);
  const [timeLimitMs, setTimeLimitMs] = useState(1000);
  const [memoryLimitMb, setMemoryLimitMb] = useState(256);
  const [tagsInput, setTagsInput] = useState('');
  const [description, setDescription] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');

  // Dynamic Test Cases
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  const addTestCase = (isSample: boolean) => {
    setTestCases((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        input: '',
        expectedOutput: '',
        isSample,
      },
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
    if (!title || !description) return;

    setIsSubmitting(true);
    setSuccessMessage('');

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const problemData = {
      title,
      difficulty,
      points: Number(points),
      timeLimitMs: Number(timeLimitMs),
      memoryLimitMb: Number(memoryLimitMb),
      tags,
      description,
      inputFormat,
      outputFormat,
      sampleTestCases: testCases,
    };

    const created = await api.createProblem(problemData);
    setIsSubmitting(false);
    setSuccessMessage(`Problem "${created.title}" successfully created!`);

    setTimeout(() => {
      router.push('/admin');
    }, 1200);
  };

  const inputStyles =
    'w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors';
  const labelStyles = 'text-[0.68rem] font-medium text-zinc-500 dark:text-zinc-400 block mb-1';

  return (
    <AdminGuard>
      <div className="mx-auto max-w-4xl px-4 py-8 font-jetbrains">
        {/* Header */}
        <div className="mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <span className="text-[0.65rem] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
            Instructor Administration
          </span>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Create New Problem</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Define problem metadata, statement specification, and evaluation test cases.
          </p>
        </div>

        {successMessage && (
          <div className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            ✓ {successMessage} Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Core Metadata */}
          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-5 space-y-4 transition-colors">
            <h2 className="text-[0.68rem] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-400">
              Problem Metadata
            </h2>

            <div>
              <label className={labelStyles}>Problem Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Maximum Subarray Sum"
                required
                className={inputStyles}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className={labelStyles}>Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className={inputStyles}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className={labelStyles}>Points</label>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  required
                  className={inputStyles}
                />
              </div>

              <div>
                <label className={labelStyles}>Time Limit (ms)</label>
                <input
                  type="number"
                  value={timeLimitMs}
                  onChange={(e) => setTimeLimitMs(Number(e.target.value))}
                  required
                  className={inputStyles}
                />
              </div>

              <div>
                <label className={labelStyles}>Memory (MB)</label>
                <input
                  type="number"
                  value={memoryLimitMb}
                  onChange={(e) => setMemoryLimitMb(Number(e.target.value))}
                  required
                  className={inputStyles}
                />
              </div>
            </div>

            <div>
              <label className={labelStyles}>Tags (comma separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="dp, trees, graph, greedy"
                className={inputStyles}
              />
            </div>
          </div>

          {/* Problem Statement Details */}
          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-5 space-y-4 transition-colors">
            <h2 className="text-[0.68rem] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-400">
              Statement Specification
            </h2>

            <div>
              <label className={labelStyles}>Problem Description</label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Given an array of N integers, find the maximum contiguous subarray sum..."
                required
                className={inputStyles + ' resize-y'}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelStyles}>Input Format</label>
                <textarea
                  rows={3}
                  value={inputFormat}
                  onChange={(e) => setInputFormat(e.target.value)}
                  placeholder="The first line contains an integer T..."
                  className={inputStyles + ' resize-y'}
                />
              </div>

              <div>
                <label className={labelStyles}>Output Format</label>
                <textarea
                  rows={3}
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  placeholder="Print a single integer representing the answer."
                  className={inputStyles + ' resize-y'}
                />
              </div>
            </div>
          </div>

          {/* Test Cases */}
          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-5 space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <h2 className="text-[0.68rem] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-400">
                Evaluation Test Cases
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addTestCase(true)}
                  className="rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[0.65rem] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors"
                >
                  + Sample Case
                </button>
                <button
                  type="button"
                  onClick={() => addTestCase(false)}
                  className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1 text-[0.65rem] font-semibold text-zinc-650 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  + Hidden Case
                </button>
              </div>
            </div>

            {testCases.length === 0 && (
              <p className="text-xs text-zinc-500 py-4 text-center">
                No test cases added yet. Add sample or hidden cases above.
              </p>
            )}

            <div className="space-y-3">
              {testCases.map((tc, index) => (
                <div key={tc.id} className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 space-y-3 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Test Case #{index + 1} — {tc.isSample ? 'Sample' : 'Hidden'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeTestCase(index)}
                      className="text-[0.65rem] font-medium text-zinc-400 dark:text-zinc-500 hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[0.62rem] uppercase tracking-wider text-zinc-500 block mb-1">
                        Input
                      </label>
                      <textarea
                        rows={3}
                        value={tc.input}
                        onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                        placeholder="Input data"
                        className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[0.62rem] uppercase tracking-wider text-zinc-500 block mb-1">
                        Expected Output
                      </label>
                      <textarea
                        rows={3}
                        value={tc.expectedOutput}
                        onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                        placeholder="Expected output"
                        className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-5 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-6 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Problem'}
            </button>
          </div>
        </form>
      </div>
    </AdminGuard>
  );
}
