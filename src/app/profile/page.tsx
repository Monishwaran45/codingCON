'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Submission } from '@/types';
import { api } from '@/lib/api';
import { RatingGraph } from '@/components/profile/RatingGraph';
import { StatsOverview } from '@/components/profile/StatsOverview';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuthStore } from '@/store/useAuthStore';


export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);

  useEffect(() => {
    async function loadProfileData() {
      if (!isAuthenticated) return;
      setIsLoadingSubmissions(true);
      try {
        const [s, latestUser] = await Promise.all([
          api.getSubmissions().catch(() => []),
          api.getProfile().catch(() => null),
        ]);
        setSubmissions(s);
        if (latestUser) {
          useAuthStore.setState({ user: latestUser });
        }
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setIsLoadingSubmissions(false);
      }
    }
    loadProfileData();
  }, [isAuthenticated]);

  const acSubmissions = submissions.filter((s) => s.verdict === 'AC');
  const solvedProblemIds = new Set(acSubmissions.map((s) => s.problemId));
  const computedSolvedCount = Math.max(user?.solvedCount || 0, solvedProblemIds.size);

  const displayUser = user ? {
    ...user,
    solvedCount: computedSolvedCount,
    totalPoints: user.totalPoints || 0,
  } : null;

  return (
    <AuthGuard
      fallbackTitle="Sign In to View Profile"
      fallbackMessage="Please sign in to view your solve count, rating history, and past submission verdicts."
    >
      {displayUser && (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8 font-inter">
          {/* Profile Header */}
          <div className="flex items-center justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-xs">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 font-extrabold text-2xl text-white shadow-xl shadow-blue-500/20">
                {displayUser.username ? displayUser.username[0].toUpperCase() : 'U'}
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">{displayUser.username}</h1>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{displayUser.email} • Role: {displayUser.role}</p>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-900/60 dark:hover:text-white transition-colors"
            >
              LOG OUT
            </button>
          </div>

          {/* Stats Grid */}
          <StatsOverview user={displayUser} />

          {/* Rating Graph or Empty State */}
          {displayUser.ratingHistory && displayUser.ratingHistory.length > 0 ? (
            <RatingGraph history={displayUser.ratingHistory} />
          ) : (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 text-center shadow-xs">
              <p className="text-xs text-zinc-500">No rating history yet — compete in contests to start your rating curve.</p>
            </div>
          )}

          {/* Submission History Table */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Recent Submission History
            </h3>

            {isLoadingSubmissions ? (
              <SkeletonLoader count={4} className="h-10 w-full" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase text-[0.68rem] tracking-wider">
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
                        <td colSpan={5} className="py-8 text-center text-xs text-zinc-500 font-mono">
                          No submissions recorded yet. Select a problem from the archive to submit your solution.
                        </td>
                      </tr>
                    ) : (
                      submissions.map((sub) => (
                        <tr key={sub.id} className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                          <td className="py-2.5 px-3 font-mono text-zinc-400">{sub.id}</td>
                          <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-100">{sub.problemTitle}</td>
                          <td className="py-2.5 px-3 text-zinc-500">{sub.language}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`font-bold px-2 py-0.5 rounded text-[0.65rem] ${
                                sub.verdict === 'AC'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                              }`}
                            >
                              {sub.verdict === 'AC' ? 'ACCEPTED' : 'WRONG ANSWER'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-zinc-500 font-mono">{sub.executionTimeMs}ms</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
