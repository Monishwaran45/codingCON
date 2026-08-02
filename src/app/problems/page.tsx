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
      <div className="border-b border-zinc-200/80 dark:border-zinc-800/80 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[0.62rem] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-1">
            Question Bank • CIT Assessment System
          </span>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Problem Archive & Practice Challenges
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Curated programming problems for internal college examinations and competitive practice.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
          <span className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            Total: <strong className="text-zinc-900 dark:text-zinc-100">{problems.length}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
            Solved: {problems.filter((p) => p.isSolved).length}
          </span>
        </div>
      </div>

      {/* Filter Toolbar & Topic Pills */}
      <div className="space-y-3">
        <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
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

        {/* Quick Topic Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[0.65rem] font-bold text-zinc-400 uppercase mr-1">Topics:</span>
          {['Arrays', 'Dynamic Programming', 'Strings', 'Graphs', 'Math', 'Trees', 'Sorting'].map((tag) => {
            const isSelected = searchQuery.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                onClick={() => setSearchQuery(isSelected ? '' : tag)}
                className={`px-2.5 py-1 rounded-full text-[0.68rem] font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                #{tag}
              </button>
            );
          })}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[0.65rem] text-red-500 hover:underline font-bold ml-2"
            >
              Reset Tag
            </button>
          )}
        </div>
      </div>

      {/* Problem High-Density Table */}
      {hasError ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 p-12 text-center shadow-sm">
          <p className="text-xs text-red-500 dark:text-red-400 mb-3 font-semibold">Assessment server is currently unreachable.</p>
          <button
            onClick={() => retryLoad()}
            className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          <SkeletonLoader count={5} className="h-12 w-full rounded-lg" />
        </div>
      ) : filteredProblems.length > 0 ? (
        <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs font-jetbrains">
            <thead className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 uppercase text-[0.65rem] tracking-wider">
              <tr>
                <th className="py-3 px-4">Problem Specification</th>
                <th className="py-3 px-4 text-center">Difficulty</th>
                <th className="py-3 px-4 text-center">Max Points</th>
                <th className="py-3 px-4 text-center">Acceptance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {filteredProblems.map((problem) => {
                const diffLabels = {
                  easy: { text: 'EASY', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                  medium: { text: 'MEDIUM', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' },
                  hard: { text: 'HARD', color: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20' },
                };
                const spec = diffLabels[problem.difficulty] || diffLabels.medium;

                return (
                  <tr key={problem.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors group">
                    <td className="py-3.5 px-4">
                      <Link href={`/problems/${problem.id}`} className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {problem.title}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-1">
                        {problem.tags.map((t) => (
                          <span key={t} className="text-[0.6rem] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.2 rounded border border-zinc-200/50 dark:border-zinc-800/50">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`text-[0.62rem] font-extrabold px-2 py-0.5 rounded border ${spec.color}`}>
                        {spec.text}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-zinc-800 dark:text-zinc-200">
                      {problem.points} <span className="text-[0.6rem] font-normal text-zinc-400">PTS</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-zinc-500 dark:text-zinc-400">
                      {problem.acceptanceRate}%
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[0.62rem] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          problem.isSolved
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        {problem.isSolved ? 'ACCEPTED' : 'UNSOLVED'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/problems/${problem.id}`}
                        className="inline-flex items-center gap-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-[0.7rem] font-bold text-zinc-700 dark:text-zinc-200 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white hover:border-blue-600 transition-all shadow-xs"
                      >
                        <span>Solve</span>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : problems.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/45 dark:bg-zinc-950/40 p-12 text-center">
          <p className="text-xs text-zinc-500">No problems are scheduled in the evaluation archive.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/45 dark:bg-zinc-950/40 p-12 text-center">
          <p className="text-xs text-zinc-500 mb-2">No matching problems found for query &ldquo;{searchQuery}&rdquo;.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDifficulty('all');
              setSelectedStatus('all');
            }}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

