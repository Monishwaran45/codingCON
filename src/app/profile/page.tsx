'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Submission } from '@/types';
import { api } from '@/lib/api';
import { RatingGraph } from '@/components/profile/RatingGraph';
import { StatsOverview } from '@/components/profile/StatsOverview';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useAuthStore } from '@/store/useAuthStore';

import { getRatingTitle } from '@/lib/ranking';

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);

  useEffect(() => {
    async function loadSubmissions() {
      if (!isAuthenticated) return;
      setIsLoadingSubmissions(true);
      const s = await api.getSubmissions();
      setSubmissions(s);
      setIsLoadingSubmissions(false);
    }
    loadSubmissions();
  }, [isAuthenticated]);

  if (!isAuthenticated || !user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center font-inter">
        <p className="text-xs text-zinc-500 mb-4">Please sign in to view your profile.</p>
        <Link href="/" className="inline-block rounded-md bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8 font-inter">
      {/* Profile Header */}
      <div className="flex items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-6 transition-colors duration-150">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded bg-zinc-200 dark:bg-zinc-800 font-extrabold text-xl text-zinc-800 dark:text-white">
            {user.username[0].toUpperCase()}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{user.username}</h1>
              <span className="rounded bg-blue-600/10 px-2.5 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {getRatingTitle(user.rating)}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{user.email} • Role: {user.role}</p>
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="rounded-md border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-white transition-colors"
        >
          LOG OUT
        </button>
      </div>

      {/* Stats Grid */}
      <StatsOverview user={user} />

      {/* Rating Graph or Empty State */}
      {user.ratingHistory && user.ratingHistory.length > 0 ? (
        <RatingGraph history={user.ratingHistory} />
      ) : (
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-8 text-center transition-colors">
          <p className="text-xs text-zinc-500">No assessment rating history recorded yet.</p>
        </div>
      )}

      {/* Submission History Table */}
      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 space-y-4 transition-colors">
        <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Recent Submission History
        </h3>

        {isLoadingSubmissions ? (
          <SkeletonLoader count={4} className="h-10 w-full" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase text-[0.68rem] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Problem</th>
                  <th className="py-2.5 px-3">Language</th>
                  <th className="py-2.5 px-3">Verdict</th>
                  <th className="py-2.5 px-3">Runtime</th>
                </tr>
              </thead>
              <tbody>
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-zinc-500 font-jetbrains">
                      No submissions recorded yet. Select a problem from the archive to submit your solution.
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub) => (
                    <tr key={sub.id} className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-zinc-500">{sub.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-zinc-800 dark:text-zinc-200">{sub.problemTitle}</td>
                      <td className="py-2.5 px-3 text-zinc-650 dark:text-zinc-400">{sub.language}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[0.65rem] ${
                            sub.verdict === 'AC'
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-650 dark:text-red-400 border border-red-500/30'
                          }`}
                        >
                          {sub.verdict === 'AC' ? 'ACCEPTED' : 'WRONG ANSWER'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-500 dark:text-zinc-400">{sub.executionTimeMs}ms</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
