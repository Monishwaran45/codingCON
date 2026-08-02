'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ContestBanner } from '@/components/contest/ContestBanner';
import { AnnouncementFeed } from '@/components/contest/AnnouncementFeed';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useContestStore } from '@/store/useContestStore';

import { useParams } from 'next/navigation';

export default function ContestPage() {
  const params = useParams();
  const contestId = (params?.id as string) || '';

  const { contest, setContest } = useContestStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadContest() {
      if (!contestId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const data = await api.getContest(contestId);
      if (data) {
        setContest(data);
      }
      setIsLoading(false);
    }
    loadContest();
  }, [contestId, setContest]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SkeletonLoader count={1} className="h-44 w-full mb-6" />
        <SkeletonLoader count={4} className="h-32 w-full" />
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center font-jetbrains">
        <p className="text-xs text-zinc-500 mb-4">No active contest found.</p>
        <Link href="/problems" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
          Return to Problem Archive
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 font-jetbrains space-y-6">
      {/* Contest Banner */}
      <ContestBanner contest={contest} />

      {/* Navigation tabs */}
      <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-3 -mb-3">
          Assessment Problems ({contest.problems.length})
        </span>
        <Link
          href={`/contest/${contest.id}/leaderboard`}
          className="text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 pb-3 -mb-3 transition-colors"
        >
          Live Standings 🏆
        </Link>
      </div>

      {/* Announcements */}
      <div className="mb-6">
        <AnnouncementFeed announcements={contest.announcements} />
      </div>

      {/* Contest Problem Set High-Density Table */}
      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden transition-colors">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 uppercase text-[0.65rem] tracking-wider">
            <tr>
              <th className="py-3 px-4">Problem Name</th>
              <th className="py-3 px-4 text-center">Difficulty</th>
              <th className="py-3 px-4 text-center">Max Score</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {contest.problems.map((problem) => {
              const diffLabels = {
                easy: { text: 'EASY', color: 'text-emerald-600 dark:text-emerald-400' },
                medium: { text: 'MEDIUM', color: 'text-amber-600 dark:text-amber-400' },
                hard: { text: 'HARD', color: 'text-red-650 dark:text-red-400' },
              };
              const spec = diffLabels[problem.difficulty] || diffLabels.medium;

              return (
                <tr key={problem.id} className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                  <td className="py-3 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                    {problem.title}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[0.65rem] font-bold ${spec.color}`}>
                      {spec.text}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-zinc-700 dark:text-zinc-300">
                    {problem.points}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/problems/${problem.id}`}
                      className="inline-block rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1 text-[0.68rem] font-semibold text-zinc-650 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      Solve Challenge
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
