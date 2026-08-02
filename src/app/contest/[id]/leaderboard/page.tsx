'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LeaderboardEntry } from '@/types';
import { api } from '@/lib/api';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { ContestTimer } from '@/components/contest/ContestTimer';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      setIsLoading(true);
      const data = await api.getLeaderboard('c88');
      setEntries(data);
      setIsLoading(false);
    }
    loadLeaderboard();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 font-jetbrains text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-1">
            <Link href="/contest/c88" className="hover:underline">← Back to Contest</Link>
          </div>
          <h1 className="font-jetbrains text-3xl font-extrabold text-slate-100 sm:text-4xl">
            Live Standings Leaderboard
          </h1>
        </div>

        <ContestTimer />
      </div>

      {isLoading ? (
        <SkeletonLoader count={8} className="h-14 w-full mb-3" />
      ) : (
        <LeaderboardTable
          entries={entries}
          currentUserId="u3"
          isFrozen={false}
        />
      )}
    </div>
  );
}
