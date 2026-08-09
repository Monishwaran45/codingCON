'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ContestBanner } from '@/components/contest/ContestBanner';
import { AnnouncementFeed } from '@/components/contest/AnnouncementFeed';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useContestStore } from '@/store/useContestStore';
import { useAuthStore } from '@/store/useAuthStore';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';

const DIFF_STYLES: Record<string, string> = {
  easy: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  medium: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
  hard: 'text-red-700 dark:text-red-400 bg-red-500/10 border-red-500/30',
};

const tableVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export default function ContestPage() {
  return (
    <AuthGuard
      fallbackTitle="Sign In to Enter Contest Arena"
      fallbackMessage="Please sign in with your student or faculty credentials to access the live contest assessment arena, solve problems, and compete on the leaderboard."
    >
      <ContestArenaContent />
    </AuthGuard>
  );
}

function ContestArenaContent() {
  const params = useParams();
  const contestId = (params?.id as string) || '';

  const { contest, setContest, solvedProblemIds, setSolvedProblemIds } = useContestStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadContest() {
      if (!contestId) { setIsLoading(false); return; }
      setIsLoading(true);

      try {
        // Load contest data and leaderboard in parallel
        const [data, leaderboard] = await Promise.all([
          api.getContest(contestId),
          api.getLeaderboard(contestId).catch(() => []),
        ]);

        if (data) setContest(data);

        // Seed solved problems from the current user's leaderboard entry
        if (user && leaderboard.length > 0) {
          const myEntry = leaderboard.find((e) => e.userId === user.id);
          if (myEntry?.problemBreakdown) {
            const solved = Object.entries(myEntry.problemBreakdown)
              .filter(([, v]) => !!v.solvedTime)
              .map(([problemId]) => problemId);
            setSolvedProblemIds(solved);
          }
        }
      } catch (err) {
        console.error('Failed to load contest:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadContest();

    // Subscribe to live contest events (Stop, Extend, End)
    const handleContestUpdate = (updated: import('@/types').Contest) => {
      if (updated && updated.id === contestId) {
        setContest(updated);
      }
    };
    const { socketService } = require('@/lib/socket');
    socketService.subscribeToContest(contestId, handleContestUpdate);

    return () => {
      socketService.unsubscribeFromContest(contestId, handleContestUpdate);
    };
  }, [contestId, user, setContest, setSolvedProblemIds]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <SkeletonLoader count={1} className="h-32 w-full mb-6 rounded-xl" />
        <SkeletonLoader count={4} className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center font-inter">
        <div className="glass-panel rounded-2xl p-10 space-y-4">
          <div className="text-3xl">📋</div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">No active contest found for this session.</p>
          <Link href="/problems" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
            Browse Problem Archive
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </div>
    );
  }

  const isEnded = new Date(contest.endTime) < new Date();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 font-inter space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="pb-2"
      >
        <span className="text-[0.62rem] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-2">
          Contest Session · CIT Assessment System
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-1">
          {contest.title}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {isEnded
            ? 'This contest has ended. All problems are now available in the Problem Archive for practice.'
            : `${contest.problems.length} problems · ${contest.durationMinutes} minutes · Solve and submit before time runs out.`}
        </p>
      </motion.div>

      {/* Contest Banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <ContestBanner contest={contest} />
      </motion.div>

      {/* Navigation tabs */}
      <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-3 -mb-3">
          Problems ({contest.problems.length})
        </span>
        <Link
          href={`/contest/${contest.id}/leaderboard`}
          className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 pb-3 -mb-3 transition-colors"
        >
          Standings
        </Link>
      </div>

      {/* Announcements */}
      {contest.announcements && contest.announcements.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <AnnouncementFeed announcements={contest.announcements} />
        </motion.div>
      )}

      {/* Contest Problem Set */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="glass-panel rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/80 dark:bg-zinc-900/40 text-zinc-500 dark:text-zinc-400 uppercase text-[0.62rem] tracking-wider">
              <tr>
                <th className="py-3.5 px-5 font-semibold w-12">#</th>
                <th className="py-3.5 px-5 font-semibold">Problem</th>
                <th className="py-3.5 px-5 text-center font-semibold">Difficulty</th>
                <th className="py-3.5 px-5 text-center font-semibold">Points</th>
                <th className="py-3.5 px-5 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <motion.tbody
              variants={tableVariants}
              initial="hidden"
              animate="show"
              className="divide-y divide-zinc-100 dark:divide-zinc-900/60"
            >
              {contest.problems.map((problem, idx) => {
                const isSolved = solvedProblemIds.has(problem.id);
                return (
                  <motion.tr
                    key={problem.id}
                    variants={rowVariants}
                    className={`transition-colors group ${
                      isSolved
                        ? 'bg-emerald-50/60 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                        : 'hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                    }`}
                  >
                    {/* # — show a checkmark icon when solved */}
                    <td className="py-4 px-5 font-mono text-[0.7rem]">
                      {isSolved ? (
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-500">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                      )}
                    </td>

                    {/* Title + tags */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/problems/${problem.id}`}
                          className={`font-semibold transition-colors ${
                            isSolved
                              ? 'text-emerald-700 dark:text-emerald-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300'
                              : 'text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                          }`}
                        >
                          {problem.title}
                        </Link>
                        {isSolved && (
                          <span className="text-[0.58rem] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-wide">
                            Solved
                          </span>
                        )}
                      </div>
                      {problem.tags && problem.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {problem.tags.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="text-[0.58rem] font-mono text-zinc-400 dark:text-zinc-500 bg-zinc-100/80 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-700/50"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Difficulty */}
                    <td className="py-4 px-5 text-center align-middle">
                      <span className={`inline-block text-[0.62rem] font-bold px-2.5 py-1 rounded-md border ${DIFF_STYLES[problem.difficulty] || DIFF_STYLES.medium}`}>
                        {problem.difficulty.toUpperCase()}
                      </span>
                    </td>

                    {/* Points */}
                    <td className={`py-4 px-5 text-center align-middle font-mono font-semibold ${
                      isSolved ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'
                    }`}>
                      {problem.points}
                    </td>

                    {/* Action button */}
                    <td className="py-4 px-5 text-right align-middle">
                      {isSolved ? (
                        <Link
                          href={`/problems/${problem.id}`}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Solved
                        </Link>
                      ) : (
                        <Link
                          href={`/problems/${problem.id}`}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:bg-blue-600 group-hover:text-white transition-all"
                        >
                          {isEnded ? 'Practice' : 'Solve'}
                          <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        </div>
      </motion.div>

      {/* Post-contest archive notice */}
      {isEnded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-6"
        >
          <Link
            href="/problems"
            className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            View all problems in the archive
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </motion.div>
      )}
    </div>
  );
}
