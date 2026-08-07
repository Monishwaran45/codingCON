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

  // Subscribe to live WebSocket updates from the Leaderboard microservice
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

    // Fallback live polling every 5 seconds to ensure it stays in sync
    // in case the WebSocket connection drops or isn't active
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [contestId, setLeaderboard, setContest]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 font-inter space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 font-jetbrains text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-1">
            <Link href={contestId ? `/contest/${contestId}` : '/problems'} className="hover:underline">← Back to Contest</Link>
          </div>
          <h1 className="font-jetbrains text-3xl font-extrabold text-slate-100 sm:text-4xl">
            Live Standings Leaderboard
          </h1>
        </div>

        <ContestTimer endTime={contest?.endTime} />
      </div>

      {isLoading ? (
        <SkeletonLoader count={8} className="h-14 w-full mb-3" />
      ) : leaderboard.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-12 text-center font-jetbrains">
          <p className="text-xs text-slate-500">No leaderboard standings available yet.</p>
        </div>
      ) : (
        <LeaderboardTable
          entries={leaderboard}
          currentUserId={user?.id || ''}
          isFrozen={false}
        />
      )}
    </div>
  );
}
