'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Problem, Difficulty } from '@/types';
import { api } from '@/lib/api';
import { ProblemFilters } from '@/components/problems/ProblemFilters';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { AuthGuard } from '@/components/auth/AuthGuard';
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
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.1 } }
};

export default function ProblemsPage() {
  return (
    <AuthGuard
      fallbackTitle="Sign In to Access Problem Archive"
      fallbackMessage="Please sign in with your student or faculty account to view programming problems, run code, and track your solved challenge statistics."
    >
      <ProblemsListContent />
    </AuthGuard>
  );
}

function ProblemsListContent() {
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
        if (selectedDifficulty !== 'all' && p.difficulty !== selectedDifficulty) return false;
        if (selectedStatus === 'solved' && !p.isSolved) return false;
        if (selectedStatus === 'unsolved' && p.isSolved) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchTag = p.tags.some((t) => t.toLowerCase().includes(q));
          return matchTitle || matchTag;
        }
        return true;
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
      </motion.div>

      {/* Topic Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 whitespace-nowrap">Topics:</span>
        {TOPIC_PILLS.map((topic) => {
          const isSelected = searchQuery.toLowerCase() === topic.toLowerCase();
          return (
            <button
              key={topic}
              onClick={() => setSearchQuery(isSelected ? '' : topic)}
              className={`whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              {topic}
            </button>
          );
        })}
      </div>

      {/* Problems Table / States */}
      {isLoading ? (
        <div className="space-y-3">
          <SkeletonLoader count={8} className="h-16 w-full rounded-2xl" />
        </div>
      ) : hasError ? (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto text-xl font-bold">!</div>
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Failed to load problem archive</p>
            <p className="text-xs text-zinc-500 mt-1">Check your network connection and verify the backend API server is operational.</p>
          </div>
          <button
            onClick={() => setRetryCount((c) => c + 1)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-md shadow-blue-500/20"
          >
            Retry Connection
          </button>
        </div>
      ) : filteredProblems.length > 0 ? (
        <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs font-inter border-collapse">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-400 dark:text-zinc-500 uppercase text-[0.68rem] tracking-wider">
              <tr>
                <th className="py-4 px-6 font-bold w-12 text-center">#</th>
                <th className="py-4 px-6 font-bold">Title</th>
                <th className="py-4 px-6 font-bold text-center">Difficulty</th>
                <th className="py-4 px-6 font-bold text-center">Points</th>
                <th className="py-4 px-6 font-bold text-center">Time Limit</th>
                <th className="py-4 px-6 font-bold text-center">Memory Limit</th>
                <th className="py-4 px-6 font-bold text-right">Action</th>
              </tr>
            </thead>
            <motion.tbody
              variants={tableVariants}
              initial="hidden"
              animate="show"
              className="divide-y divide-zinc-100 dark:divide-zinc-800/60"
            >
              <AnimatePresence mode="popLayout">
                {filteredProblems.map((problem, idx) => (
                  <motion.tr
                    key={problem.id}
                    variants={rowVariants}
                    layout
                    className="group hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
                  >
                    <td className="py-4 px-6 text-center font-mono text-zinc-400 text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {problem.isSolved && (
                          <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[0.65rem] font-bold">
                            ✓
                          </span>
                        )}
                        <Link
                          href={`/problems/${problem.id}`}
                          className="font-bold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-[0.85rem]"
                        >
                          {problem.title}
                        </Link>
                      </div>
                      <div className="flex gap-1.5 mt-1.5">
                        {problem.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="text-[0.62rem] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-md border border-zinc-200/50 dark:border-zinc-700/50"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider ${DIFF_STYLES[problem.difficulty]}`}>
                        {problem.difficulty}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center font-mono font-bold text-zinc-700 dark:text-zinc-300">
                      {problem.points}
                    </td>
                    <td className="py-4 px-6 text-center font-mono text-zinc-500 text-xs">
                      {problem.timeLimitMs} ms
                    </td>
                    <td className="py-4 px-6 text-center font-mono text-zinc-500 text-xs">
                      {problem.memoryLimitMb} MB
                    </td>
                    <td className="py-4 px-6 text-right">
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
