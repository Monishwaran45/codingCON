'use client';

import React, { useEffect, useState } from 'react';
import { User, Submission } from '@/types';
import { api } from '@/lib/api';
import { StreakWidget } from '@/components/profile/StreakWidget';
import { RatingGraph } from '@/components/profile/RatingGraph';
import { StatsOverview } from '@/components/profile/StatsOverview';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [u, s] = await Promise.all([api.getProfile(), api.getSubmissions()]);
      setUser(u);
      setSubmissions(s);
      setIsLoading(false);
    }
    loadData();
  }, []);

  if (isLoading || !user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <SkeletonLoader count={1} className="h-44 w-full mb-6" />
        <SkeletonLoader count={3} className="h-28 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8 font-jetbrains">
      {/* Profile Header */}
      <div className="flex items-center gap-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 font-extrabold text-2xl text-white shadow-xl shadow-cyan-500/20">
          {user.username[0].toUpperCase()}
        </div>

        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-100">{user.username}</h1>
            <span className="rounded-full bg-cyan-500/20 px-3 py-0.5 text-xs font-bold text-cyan-400 border border-cyan-500/40">
              Candidate Master
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{user.email} • Role: {user.role}</p>
        </div>
      </div>

      {/* Streak Widget */}
      <StreakWidget streakDays={user.streakDays} />

      {/* Stats Grid */}
      <StatsOverview user={user} />

      {/* Rating Graph */}
      <RatingGraph history={user.ratingHistory} />

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
