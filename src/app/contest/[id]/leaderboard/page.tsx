'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { ContestTimer } from '@/components/contest/ContestTimer';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useContestStore } from '@/store/useContestStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useLeaderboardSocket } from '@/hooks/useSocket';
import { useParams } from 'next/navigation';

export default function LeaderboardPage() {
  const params = useParams();
  const contestId = (params?.id as string) || '';

  const { contest, setContest, leaderboard, setLeaderboard } = useContestStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to live WebSocket updates
  useLeaderboardSocket(contestId, (updatedLeaderboard) => {
    if (Array.isArray(updatedLeaderboard)) {
      setLeaderboard(updatedLeaderboard);
    }
  });

  useEffect(() => {
    async function loadData() {
      if (!contestId) {
        setIsLoading(false);
        return;
      }
      const [lbData, contestData] = await Promise.all([
        api.getLeaderboard(contestId).catch(() => []),
        api.getContest(contestId).catch(() => null),
      ]);
      setLeaderboard(lbData);
      if (contestData) setContest(contestData);
      setIsLoading(false);
    }
    
    // Initial load
    setIsLoading(true);
    loadData();

    // Live polling fallback every 4 seconds to guarantee real-time sync
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [contestId, setLeaderboard, setContest]);

  const isEnded = contest?.endTime ? new Date(contest.endTime) < new Date() : false;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 font-inter space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-1.5">
            <Link
              href={contestId ? `/contest/${contestId}` : '/problems'}
              className="hover:underline inline-flex items-center gap-1 transition-colors"
            >
              ← Back to Contest Arena
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Live Standings Leaderboard
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {contest?.title ? `${contest.title} · ` : ''}Real-time rank standings, problem breakdown & penalties
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isEnded ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 uppercase">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              CONTEST ENDED
            </span>
          ) : (
            contest && <ContestTimer endTime={contest.endTime} durationMinutes={contest.durationMinutes} />
          )}
        </div>
      </div>

      {isLoading ? (
        <SkeletonLoader count={6} className="h-14 w-full mb-3 rounded-xl" />
      ) : leaderboard.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-12 text-center shadow-xs">
          <div className="text-3xl mb-2">🏆</div>
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">No leaderboard standings recorded yet</p>
          <p className="text-xs text-zinc-500">When participants submit solutions, real-time standings will appear here.</p>
        </div>
      ) : (
        <LeaderboardTable
          entries={leaderboard}
          currentUserId={user?.id || ''}
          isFrozen={!!contest?.isLeaderboardFrozen}
        />
      )}
    </div>
  );
}
