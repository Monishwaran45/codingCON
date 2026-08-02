'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Problem, Difficulty } from '@/types';
import { api } from '@/lib/api';
import { ProblemCard } from '@/components/problems/ProblemCard';
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header Banner */}
      <div className="mb-8">
        <div className="flex items-center gap-2 font-jetbrains text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider mb-1">
          <span>Problem Archive</span>
        </div>
        <h1 className="font-jetbrains text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          Problem Set
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Choose a problem to begin your assessment. Your submission status is tracked automatically.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="mb-6">
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

      {/* Problem Cards Grid */}
      {hasError ? (
        <div className="rounded-md border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 p-12 text-center font-jetbrains transition-colors">
          <p className="text-xs text-red-600 dark:text-red-400 mb-3">Unable to connect to the problem server.</p>
          <button
            onClick={() => retryLoad()}
            className="rounded-md border border-red-300 dark:border-red-500/40 bg-red-100 dark:bg-red-500/10 px-4 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonLoader count={6} className="h-44" />
        </div>
      ) : filteredProblems.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProblems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))}
        </div>
      ) : problems.length === 0 ? (
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/10 p-12 text-center font-jetbrains transition-colors">
          <p className="text-xs text-zinc-500">No problems available in the archive yet.</p>
        </div>
      ) : (
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-12 text-center font-jetbrains transition-colors">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">No problems match your current filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDifficulty('all');
              setSelectedStatus('all');
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
