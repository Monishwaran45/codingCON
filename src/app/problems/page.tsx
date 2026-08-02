'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Problem, Difficulty } from '@/types';
import { api } from '@/lib/api';
import { ProblemFilters } from '@/components/problems/ProblemFilters';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'solved' | 'unsolved'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'difficulty' | 'acceptance'>('recent');

  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function fetchProblems() {
      setIsLoading(true);
      setHasError(false);
      try {
        const data = await api.getProblems();
        if (!cancelled) setProblems(data);
      } catch {
        if (!cancelled) setHasError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchProblems();
    return () => { cancelled = true; };
  }, [retryCount]);

  const retryLoad = () => setRetryCount((c) => c + 1);

  // Instant Client-side filtering & sorting
  const filteredProblems = useMemo(() => {
    return problems
      .filter((p) => {
        const matchesSearch =
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesDiff = selectedDifficulty === 'all' || p.difficulty === selectedDifficulty;
        const matchesStatus =
          selectedStatus === 'all'
            ? true
            : selectedStatus === 'solved'
            ? p.isSolved
            : !p.isSolved;

        return matchesSearch && matchesDiff && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'recent') {
          const aTime = a.lastAttemptedAt ? new Date(a.lastAttemptedAt).getTime() : 0;
          const bTime = b.lastAttemptedAt ? new Date(b.lastAttemptedAt).getTime() : 0;
          return bTime - aTime;
        }
        if (sortBy === 'acceptance') return b.acceptanceRate - a.acceptanceRate;
        if (sortBy === 'difficulty') {
          const rank = { easy: 1, medium: 2, hard: 3 };
          return rank[a.difficulty] - rank[b.difficulty];
        }
        return 0;
      });
  }, [problems, searchQuery, selectedDifficulty, selectedStatus, sortBy]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 font-jetbrains space-y-6">
      {/* Header Banner */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <span className="text-[0.65rem] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
          Assessment Resources
        </span>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Problem Code Bank
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Select allocated programming tasks below for practice or scheduled evaluations.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-md border border-zinc-200 dark:border-zinc-800">
        <ProblemFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedDifficulty={selectedDifficulty}
          onDifficultyChange={setSelectedDifficulty}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {/* Problem High-Density List */}
      {hasError ? (
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 p-12 text-center">
          <p className="text-xs text-red-500 dark:text-red-400 mb-3 font-semibold">Assessment server is currently unreachable.</p>
          <button
            onClick={() => retryLoad()}
            className="rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          <SkeletonLoader count={5} className="h-10 w-full" />
        </div>
      ) : filteredProblems.length > 0 ? (
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 uppercase text-[0.65rem] tracking-wider">
              <tr>
                <th className="py-3 px-4">Problem Specification</th>
                <th className="py-3 px-4 text-center">Difficulty</th>
                <th className="py-3 px-4 text-center">Max Points</th>
                <th className="py-3 px-4 text-center">Acceptance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProblems.map((problem) => {
                const diffLabels = {
                  easy: { text: 'EASY', color: 'text-emerald-600 dark:text-emerald-400' },
                  medium: { text: 'MEDIUM', color: 'text-amber-600 dark:text-amber-400' },
                  hard: { text: 'HARD', color: 'text-red-650 dark:text-red-400' },
                };
                const spec = diffLabels[problem.difficulty] || diffLabels.medium;

                return (
                  <tr key={problem.id} className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-800 dark:text-zinc-200">{problem.title}</div>
                      <div className="text-[0.65rem] text-zinc-500 mt-0.5">
                        {problem.tags.join(', ')}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[0.65rem] font-bold ${spec.color}`}>
                        {spec.text}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-zinc-700 dark:text-zinc-300">
                      {problem.points}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-zinc-500 dark:text-zinc-400">
                      {problem.acceptanceRate}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[0.62rem] font-bold px-2 py-0.5 rounded ${
                          problem.isSolved
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/50'
                        }`}
                      >
                        {problem.isSolved ? 'ACCEPTED' : 'UNSOLVED'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/problems/${problem.id}`}
                        className="inline-block rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1 text-[0.68rem] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
                      >
                        Solve
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : problems.length === 0 ? (
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/45 dark:bg-zinc-950/40 p-12 text-center">
          <p className="text-xs text-zinc-500">No problems are scheduled in the evaluation archive.</p>
        </div>
      ) : (
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/45 dark:bg-zinc-950/40 p-12 text-center">
          <p className="text-xs text-zinc-500 mb-2">No matching problems found.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDifficulty('all');
              setSelectedStatus('all');
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
