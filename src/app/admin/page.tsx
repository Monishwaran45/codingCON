'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Problem } from '@/types';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
<<<<<<< HEAD

=======
>>>>>>> f4ea211f46724849dff0a0455c065cbfa4e882f5


export default function AdminDashboardPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  useEffect(() => {
    async function loadProblems() {
      setIsLoading(true);
      try {
        const data = await api.getProblems();
        setProblems(data);
      } catch (error) {
        console.error('Failed to load admin problems:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadProblems();
  }, []);

  const filteredProblems = problems.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiff = selectedDifficulty === 'all' || p.difficulty === selectedDifficulty;
    return matchesSearch && matchesDiff;
  });

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 font-jetbrains space-y-6">
        {/* Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[0.65rem] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
              Instructor Administration Console
            </span>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Course Problems Management</h1>
            <p className="text-xs text-zinc-500 mt-1">
              Create, update, and manage candidate programming tasks and evaluation testsuites.
            </p>
          </div>

          <Link
            href="/admin/problems/new"
            className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            + Create New Problem
          </Link>
        </div>

        {/* Operational Filters */}
        <div className="flex flex-col sm:flex-row gap-3 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-md border border-zinc-200 dark:border-zinc-800">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by problem title..."
            className="flex-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-1.5 text-xs text-zinc-800 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-650 focus:border-zinc-400 dark:focus:border-zinc-700 focus:outline-none transition-colors"
          />
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:border-zinc-400 dark:focus:border-zinc-700 focus:outline-none transition-colors"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Problems Management Table */}
        {isLoading ? (
          <div className="space-y-2">
            <SkeletonLoader count={5} className="h-10 w-full" />
          </div>
        ) : filteredProblems.length > 0 ? (
          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden transition-colors">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 uppercase text-[0.65rem] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Problem Name</th>
                  <th className="py-3 px-4 text-center">Difficulty</th>
                  <th className="py-3 px-4 text-center">Max Points</th>
                  <th className="py-3 px-4 text-center">Constraints (Time / Memory)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProblems.map((problem) => (
                  <tr key={problem.id} className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                      {problem.title}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[0.65rem] font-bold text-zinc-650 dark:text-zinc-450 uppercase">
                        {problem.difficulty}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-zinc-700 dark:text-zinc-300">
                      {problem.points}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-zinc-500 dark:text-zinc-455">
                      {problem.timeLimitMs}ms / {problem.memoryLimitMb}MB
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[0.62rem] font-bold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                        PUBLISHED
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/problems/${problem.id}`}
                        className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:underline transition-colors"
                      >
                        View Code →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/40 p-12 text-center transition-colors">
            <p className="text-xs text-zinc-500">No course problems have been uploaded to the management system.</p>
          </div>
        )}
      </div>
    </>
  );
}
