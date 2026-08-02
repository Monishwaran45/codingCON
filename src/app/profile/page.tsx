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
      <div className="mx-auto max-w-md px-4 py-16 text-center font-jetbrains">
        <p className="text-xs text-slate-500 mb-4">Please sign in to view your profile statistics.</p>
        <a href="/" className="inline-block rounded-lg bg-cyan-500 px-6 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors">
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8 font-jetbrains">
      {/* Profile Header */}
      <div className="flex items-center justify-between rounded-2xl border border-zinc-900 bg-zinc-950 p-6">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 font-extrabold text-2xl text-white shadow-xl shadow-cyan-500/20">
            {user.username[0].toUpperCase()}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-white">{user.username}</h1>
              <span className="rounded-full bg-cyan-500/20 px-3 py-0.5 text-xs font-bold text-cyan-400 border border-cyan-500/40">
                {getRatingTitle(user.rating)}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">{user.email} • Role: {user.role}</p>
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-900/40 hover:text-white transition-colors"
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
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-8 text-center">
          <p className="text-xs text-zinc-500">No rating history yet — compete in contests to start your rating curve.</p>
        </div>
      )}

      {/* Submission History Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
          Recent Submission History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 uppercase text-[0.68rem] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Problem</th>
                <th className="py-2.5 px-3">Language</th>
                <th className="py-2.5 px-3">Verdict</th>
                <th className="py-2.5 px-3">Runtime</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id} className="border-b border-slate-800/60 hover:bg-slate-950/40">
                  <td className="py-2.5 px-3 font-mono text-slate-500">{sub.id}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{sub.problemTitle}</td>
                  <td className="py-2.5 px-3 text-slate-400">{sub.language}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[0.65rem] ${
                        sub.verdict === 'AC'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {sub.verdict === 'AC' ? 'ACCEPTED' : 'WRONG ANSWER'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{sub.executionTimeMs}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
