'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Problem, Difficulty } from '@/types';
import { api } from '@/lib/api';
import { ProblemFilters } from '@/components/problems/ProblemFilters';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { motion, AnimatePresence } from 'framer-motion';

const DIFF_STYLES = {
  easy: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  medium: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
  hard: 'text-red-700 dark:text-red-400 bg-red-500/10 border-red-500/30',
};

const TOPIC_PILLS = ['Arrays', 'Dynamic Programming', 'Strings', 'Graphs', 'Math', 'Trees', 'Sorting', 'Stack', 'Binary Search'];

const tableVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.1 } }
};

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'solved' | 'unsolved'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'difficulty' | 'acceptance'>('recent');

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

  const filteredProblems = useMemo(() => {
    return problems
      .filter((p) => {
        const matchesSearch =
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesDiff = selectedDifficulty === 'all' || p.difficulty === selectedDifficulty;
        const matchesStatus =
          selectedStatus === 'all' ? true
            : selectedStatus === 'solved' ? p.isSolved
            : !p.isSolved;
        return matchesSearch && matchesDiff && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'acceptance') return b.acceptanceRate - a.acceptanceRate;
        if (sortBy === 'difficulty') {
          const rank = { easy: 1, medium: 2, hard: 3 };
          return rank[a.difficulty] - rank[b.difficulty];
        }
        return 0;
      });
  }, [problems, searchQuery, selectedDifficulty, selectedStatus, sortBy]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 font-inter space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6"
      >
        <div>
          <span className="text-[0.62rem] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-2">
            Problem Archive · CIT Assessment System
          </span>
          <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
            Programming <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Problems</span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Curated problems for internal college exams and competitive practice.
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
          <div className="px-3 py-1.5 rounded-lg glass-panel font-semibold">
            Total: <strong className="text-zinc-900 dark:text-zinc-100">{problems.length}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 font-bold shadow-sm shadow-emerald-500/10">
            Solved: {problems.filter((p) => p.isSolved).length}
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
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

        {/* Topic Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs scrollbar-hide">
          <span className="text-[0.65rem] font-bold text-zinc-400 uppercase mr-1 shrink-0">Tags:</span>
          {TOPIC_PILLS.map((tag) => {
            const isSelected = searchQuery.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                onClick={() => setSearchQuery(isSelected ? '' : tag)}
                className={`px-3 py-1 rounded-full text-[0.65rem] font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-600/20 ring-offset-1 ring-offset-zinc-50 dark:ring-offset-zinc-950'
                    : 'glass-panel hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                #{tag}
              </button>
            );
          })}
          {searchQuery && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              onClick={() => setSearchQuery('')}
              className="text-[0.65rem] text-red-500 hover:text-red-600 hover:underline font-bold ml-2 shrink-0 flex items-center gap-1"
            >
              ✕ Clear
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Problem Table */}
      {hasError ? (
        <div className="glass-panel rounded-2xl p-16 text-center border-dashed border-red-200 dark:border-red-900/50">
          <p className="text-sm text-red-600 dark:text-red-400 mb-4 font-semibold">Backend connection failed. Showing cached problems.</p>
          <button
            onClick={() => setRetryCount((c) => c + 1)}
            className="rounded-xl bg-zinc-900 dark:bg-white px-6 py-2.5 text-xs font-bold text-white dark:text-zinc-900 hover:scale-105 transition-transform shadow-lg"
          >
            Retry Connection
          </button>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          <SkeletonLoader count={8} className="h-16 w-full rounded-xl" />
        </div>
      ) : filteredProblems.length > 0 ? (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs font-inter">
            <thead className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/80 dark:bg-zinc-900/40 text-zinc-500 dark:text-zinc-400 uppercase text-[0.65rem] tracking-wider">
              <tr>
                <th className="py-4 px-5 font-semibold">Problem</th>
                <th className="py-4 px-5 text-center font-semibold">Difficulty</th>
                <th className="py-4 px-5 text-center font-semibold">Points</th>
                <th className="py-4 px-5 text-center font-semibold">Acceptance</th>
                <th className="py-4 px-5 text-center font-semibold">Status</th>
                <th className="py-4 px-5 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <motion.tbody 
              variants={tableVariants} initial="hidden" animate="show"
              className="divide-y divide-zinc-100 dark:divide-zinc-900/60"
            >
              <AnimatePresence>
                {filteredProblems.map((problem) => (
                  <motion.tr 
                    key={problem.id} 
                    variants={rowVariants}
                    layout="position"
                    className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group cursor-default"
                  >
                    <td className="py-4 px-5">
                      <Link
                        href={`/problems/${problem.id}`}
                        className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-500 transition-all"
                      >
                        {problem.title}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {problem.tags.slice(0, 4).map((t) => (
                          <button
                            key={t}
                            onClick={() => setSearchQuery(t)}
                            className="text-[0.6rem] font-mono font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100/80 dark:bg-zinc-800/50 px-2 py-0.5 rounded-full border border-zinc-200/50 dark:border-zinc-700/50 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/50 dark:hover:text-blue-300 transition-colors"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center align-middle">
                      <span className={`inline-block text-[0.65rem] font-extrabold px-2.5 py-1 rounded-md border shadow-sm ${DIFF_STYLES[problem.difficulty]}`}>
                        {problem.difficulty.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center align-middle font-mono font-bold text-zinc-800 dark:text-zinc-200">
                      {problem.points} <span className="text-[0.6rem] font-normal text-zinc-400">pts</span>
                    </td>
                    <td className="py-4 px-5 text-center align-middle font-mono font-semibold text-zinc-600 dark:text-zinc-400">
                      {problem.acceptanceRate}%
                    </td>
                    <td className="py-4 px-5 text-center align-middle">
                      {problem.isSolved ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 shadow-sm shadow-emerald-500/10">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-block w-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800"></span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right align-middle">
                      <Link
                        href={`/problems/${problem.id}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"
                      >
                        Solve
                        <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </motion.tbody>
          </table>
        </div>
      ) : problems.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center">
          <p className="text-sm font-semibold text-zinc-500">No problems available in the archive yet.</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-16 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 font-semibold">No problems match &ldquo;<span className="text-zinc-900 dark:text-white">{searchQuery}</span>&rdquo;.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedDifficulty('all'); setSelectedStatus('all'); }}
            className="text-xs font-bold text-white bg-blue-600 px-6 py-2.5 rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
          >
            Clear Filters
          </button>
        </motion.div>
      )}
    </div>
  );
}
