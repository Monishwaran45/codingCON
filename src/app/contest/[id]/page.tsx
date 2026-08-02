'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Contest } from '@/types';
import { api } from '@/lib/api';
import { ContestBanner } from '@/components/contest/ContestBanner';
import { AnnouncementFeed } from '@/components/contest/AnnouncementFeed';
import { ProblemCard } from '@/components/problems/ProblemCard';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

export default function ContestPage() {
  const [contest, setContest] = useState<Contest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadContest() {
      setIsLoading(true);
      const data = await api.getContest('c88');
      setContest(data);
      setIsLoading(false);
    }
    loadContest();
  }, []);

  if (isLoading || !contest) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SkeletonLoader count={1} className="h-44 w-full mb-6" />
        <SkeletonLoader count={4} className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Contest Banner with Yerkes-Dodson timer */}
      <ContestBanner contest={contest} />

      {/* Navigation tabs */}
      <div className="flex items-center gap-4 mb-6 font-jetbrains border-b border-slate-800 pb-3">
        <span className="text-sm font-bold text-cyan-400 border-b-2 border-cyan-400 pb-3 -mb-3">
          Contest Problems ({contest.problems.length})
        </span>
        <Link
          href="/contest/c88/leaderboard"
          className="text-sm font-bold text-slate-400 hover:text-slate-200 pb-3 -mb-3 transition-colors"
        >
          Live Leaderboard 🏆
        </Link>
      </div>

      {/* Announcements */}
      <div className="mb-8">
        <AnnouncementFeed announcements={contest.announcements} />
      </div>

      {/* Contest Problem Set */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {contest.problems.map((problem) => (
          <ProblemCard key={problem.id} problem={problem} />
        ))}
      </div>
    </div>
  );
}
