'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Difficulty, TestCase } from '@/types';
import { api } from '@/lib/api';

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
      router.push('/problems');
    }, 1200);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 font-jetbrains">
      {/* Header */}
      <div className="mb-8 border-b border-zinc-900 pb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">
          <span>Admin Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Upload New Problem Statement</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Define problem statements, constraints, and testcase evaluation suites for 500+ competing students.
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-400">
          ✓ {successMessage} Redirecting to problem set archive...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Core Metadata */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">1. Problem Metadata</h2>

          <div>
            <label className="text-[0.68rem] uppercase tracking-wider text-zinc-400 block mb-1.5">
              Problem Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dynamic Subtree Sum Queries"
              required
              className="w-full rounded-lg border border-zinc-800 bg-black px-3.5 py-2.5 text-xs text-white placeholder-zinc-700 focus:border-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-[0.68rem] uppercase tracking-wider text-zinc-400 block mb-1.5">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2.5 text-xs text-white focus:border-white focus:outline-none"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="text-[0.68rem] uppercase tracking-wider text-zinc-400 block mb-1.5">
                Score Points
              </label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                required
                className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2.5 text-xs text-white focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[0.68rem] uppercase tracking-wider text-zinc-400 block mb-1.5">
                Time Limit (ms)
              </label>
              <input
                type="number"
                value={timeLimitMs}
                onChange={(e) => setTimeLimitMs(Number(e.target.value))}
                required
                className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2.5 text-xs text-white focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[0.68rem] uppercase tracking-wider text-zinc-400 block mb-1.5">
                Memory Limit (MB)
              </label>
              <input
                type="number"
                value={memoryLimitMb}
                onChange={(e) => setMemoryLimitMb(Number(e.target.value))}
                required
                className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2.5 text-xs text-white focus:border-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[0.68rem] uppercase tracking-wider text-zinc-400 block mb-1.5">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="dp, trees, graph, greedy"
              className="w-full rounded-lg border border-zinc-800 bg-black px-3.5 py-2.5 text-xs text-white placeholder-zinc-700 focus:border-white focus:outline-none"
            />
          </div>
        </div>

        {/* Problem Statement Details */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">2. Statement Specification</h2>

          <div>
            <label className="text-[0.68rem] uppercase tracking-wider text-zinc-400 block mb-1.5">
              Problem Description
            </label>
            <textarea
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Given an array of N integers, find the maximum contiguous subarray sum..."
              required
              className="w-full rounded-lg border border-zinc-800 bg-black p-3.5 text-xs text-white placeholder-zinc-700 focus:border-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[0.68rem] uppercase tracking-wider text-zinc-400 block mb-1.5">
                Input Format Specification
              </label>
              <textarea
                rows={3}
                value={inputFormat}
                onChange={(e) => setInputFormat(e.target.value)}
                placeholder="The first line contains an integer T. The second line..."
                className="w-full rounded-lg border border-zinc-800 bg-black p-3 text-xs text-white placeholder-zinc-700 focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[0.68rem] uppercase tracking-wider text-zinc-400 block mb-1.5">
                Output Format Specification
              </label>
              <textarea
                rows={3}
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                placeholder="Print a single integer representing the optimal answer."
                className="w-full rounded-lg border border-zinc-800 bg-black p-3 text-xs text-white placeholder-zinc-700 focus:border-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Test Cases */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">3. Evaluation Test Cases</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addTestCase(true)}
                className="rounded border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-[0.65rem] font-bold text-cyan-400 hover:bg-cyan-500/20"
              >
                + Sample Case
              </button>
              <button
                type="button"
                onClick={() => addTestCase(false)}
                className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1 text-[0.65rem] font-bold text-zinc-300 hover:bg-zinc-850"
              >
                + Hidden Case
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {testCases.map((tc, index) => (
              <div key={tc.id} className="rounded-lg border border-zinc-900 bg-black p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-zinc-400">
                    Testcase #{index + 1} ({tc.isSample ? 'Sample' : 'Hidden Evaluation'})
                  </span>
                  {testCases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTestCase(index)}
                      className="text-[0.65rem] font-bold text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[0.62rem] uppercase tracking-wider text-zinc-500 block mb-1">
                      Standard Input
                    </label>
                    <textarea
                      rows={3}
                      value={tc.input}
                      onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                      placeholder="Input data"
                      className="w-full rounded border border-zinc-800 bg-zinc-950 p-2 font-mono text-xs text-white focus:border-white focus:outline-none"
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
                      className="w-full rounded border border-zinc-800 bg-zinc-950 p-2 font-mono text-xs text-white focus:border-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Submit */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.push('/problems')}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-6 py-3 text-xs font-bold text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-white px-8 py-3 text-xs font-extrabold text-black hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5"
          >
            {isSubmitting ? 'Uploading Problem...' : 'PUBLISH PROBLEM'}
          </button>
        </div>
      </form>
    </div>
  );
}
