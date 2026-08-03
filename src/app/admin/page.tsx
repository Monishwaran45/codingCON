'use client';

<<<<<<< HEAD
import React from 'react';
=======
import React, { useEffect, useState, useCallback } from 'react';
>>>>>>> f4becec8226ca9317ff9585eedcc5ba1074cda1d
import Link from 'next/link';
<<<<<<< HEAD
import { api } from '@/lib/api';
import { Problem, Contest } from '@/types';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
<<<<<<< HEAD

<<<<<<< HEAD
=======
>>>>>>> f4ea211f46724849dff0a0455c065cbfa4e882f5

=======
>>>>>>> 12a750d9fbaa6430b7207d6e55b65fe7a324a01f

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 font-jetbrains space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">
            <span>Instructor Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Admin Management Dashboard</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Separate admin controls for uploading problem statements, managing contests, and monitoring 500+ students.
          </p>
        </div>

        <Link
          href="/admin/problems/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-extrabold text-black hover:bg-zinc-200 transition-colors shadow-lg"
        >
          <span>+ Upload New Problem</span>
        </Link>
      </div>

      {/* Admin Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
        {/* Upload Problems Tile */}
        <Link
          href="/admin/problems/new"
          className="group block rounded-2xl border border-zinc-900 bg-zinc-950 p-6 hover:border-white transition-all duration-150"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[0.65rem] font-bold px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              PROBLEM CREATOR
            </span>
            <span className="text-zinc-600 text-sm group-hover:text-white transition-colors">→</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Upload Problem Statement</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Create new algorithmic challenges, set input/output formats, difficulty scores, and add sample and evaluation testcase suites.
          </p>
        </Link>

        {/* View Problems Archive Tile */}
        <Link
          href="/problems"
          className="group block rounded-2xl border border-zinc-900 bg-zinc-950 p-6 hover:border-zinc-700 transition-all duration-150"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[0.65rem] font-bold px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
              ARCHIVE VIEW
            </span>
            <span className="text-zinc-600 text-sm group-hover:text-white transition-colors">→</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Browse Problem Set Archive</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Review existing problems, inspect submission statistics, and check student acceptance rates across difficulties.
          </p>
        </Link>
      </div>
    </div>
=======
type Tab = 'problems' | 'contests' | 'announcements';

const DIFF_STYLES = {
  easy: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
  hard: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20',
};

export default function AdminDashboardPage() {
  const [tab, setTab] = useState<Tab>('problems');
  const [problems, setProblems] = useState<Problem[]>([]);
  const [contest, setContest] = useState<Contest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiff, setSelectedDiff] = useState<string>('all');

  // Announcement form state
  const [annMsg, setAnnMsg] = useState('');
  const [annSending, setAnnSending] = useState(false);
  const [annSuccess, setAnnSuccess] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [probs, cont] = await Promise.all([api.getProblems(), api.getContest('c88')]);
      setProblems(probs);
      setContest(cont);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await api.deleteProblem(id);
    setProblems((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annMsg.trim() || !contest) return;
    setAnnSending(true);
    await api.postAnnouncement(contest.id, annMsg.trim());
    setAnnSuccess('Announcement posted to all students.');
    setAnnMsg('');
    setAnnSending(false);
    setTimeout(() => setAnnSuccess(''), 4000);
    loadData();
  };

  const filteredProblems = problems.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchDiff = selectedDiff === 'all' || p.difficulty === selectedDiff;
    return matchSearch && matchDiff;
  });

  const stats = [
    { label: 'Total Problems', value: problems.length, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Active Contest', value: contest ? 1 : 0, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Participants', value: contest?.participantCount ?? 0, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Announcements', value: contest?.announcements?.length ?? 0, color: 'text-violet-600 dark:text-violet-400' },
  ];

  return (
    <AdminGuard>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 font-inter space-y-6">
        {/* Page Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[0.62rem] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-1">
              Faculty Administration Console
            </span>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Manage problems, contests, and student communications.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/problems/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 transition-colors shadow-sm"
            >
              <span>+</span> Create Problem
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-4"
            >
              <span className="text-[0.65rem] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                {s.label}
              </span>
              <span className={`text-2xl font-extrabold font-mono ${s.color}`}>
                {isLoading ? '—' : s.value}
              </span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="flex gap-1 -mb-px">
            {([
              { id: 'problems', label: `Problems (${problems.length})` },
              { id: 'contests', label: 'Contest Management' },
              { id: 'announcements', label: 'Announcements' },
            ] as { id: Tab; label: string }[]).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                  tab === id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Problems Tab ─────────────────────────────────────────────────── */}
        {tab === 'problems' && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or tag..."
                className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none transition-colors"
              />
              <select
                value={selectedDiff}
                onChange={(e) => setSelectedDiff(e.target.value)}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {isLoading ? (
              <SkeletonLoader count={5} className="h-12 w-full rounded-xl" />
            ) : filteredProblems.length > 0 ? (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
                <table className="w-full text-left text-xs font-inter">
                  <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 uppercase text-[0.65rem] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Problem</th>
                      <th className="py-3 px-4 text-center">Difficulty</th>
                      <th className="py-3 px-4 text-center">Points</th>
                      <th className="py-3 px-4 text-center">Constraints</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                    {filteredProblems.map((problem) => (
                      <tr key={problem.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{problem.title}</div>
                          <div className="flex gap-1.5 mt-1">
                            {problem.tags.slice(0, 3).map((t) => (
                              <span key={t} className="text-[0.6rem] font-mono bg-zinc-100 dark:bg-zinc-900 text-zinc-400 px-1.5 rounded border border-zinc-200/50 dark:border-zinc-800/50">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`text-[0.62rem] font-bold px-2 py-0.5 rounded border uppercase ${DIFF_STYLES[problem.difficulty]}`}>
                            {problem.difficulty}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-zinc-800 dark:text-zinc-200">
                          {problem.points}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-zinc-500 text-[0.7rem]">
                          {problem.timeLimitMs}ms / {problem.memoryLimitMb}MB
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-[0.62rem] font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 uppercase">
                            Published
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/problems/${problem.id}`}
                              className="text-[0.7rem] font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-colors"
                            >
                              Preview
                            </Link>
                            <button
                              onClick={() => handleDelete(problem.id, problem.title)}
                              className="text-[0.7rem] font-semibold text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">No problems yet</p>
                <p className="text-xs text-zinc-500 mb-4">Get started by creating your first problem.</p>
                <Link
                  href="/admin/problems/new"
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 transition-colors"
                >
                  + Create Problem
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Contest Tab ──────────────────────────────────────────────────── */}
        {tab === 'contests' && (
          <div className="space-y-6">
            {isLoading ? (
              <SkeletonLoader count={3} className="h-20 w-full rounded-xl" />
            ) : contest ? (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
                {/* Contest header */}
                <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-900 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[0.62rem] font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 uppercase inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Live
                      </span>
                      <span className="text-xs font-mono text-zinc-400">ID: {contest.id}</span>
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{contest.title}</h3>
                  </div>
                  <div className="text-right text-xs text-zinc-500">
                    <div>Started: <span className="font-mono">{new Date(contest.startTime).toLocaleTimeString()}</span></div>
                    <div>Ends: <span className="font-mono">{new Date(contest.endTime).toLocaleTimeString()}</span></div>
                  </div>
                </div>

                {/* Contest problems */}
                <div className="px-6 py-4">
                  <h4 className="text-[0.65rem] font-bold text-zinc-500 uppercase tracking-wider mb-3">
                    Problems in this Contest ({contest.problems.length})
                  </h4>
                  <div className="space-y-2">
                    {contest.problems.map((p, i) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-zinc-400">{String.fromCharCode(65 + i)}</span>
                          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{p.title}</span>
                          <span className={`text-[0.62rem] font-bold px-2 py-0.5 rounded border uppercase ${DIFF_STYLES[p.difficulty]}`}>
                            {p.difficulty}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-zinc-500">{p.points} pts</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-900 flex items-center gap-2">
                    <Link
                      href={`/contest/${contest.id}`}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Student Contest Page →
                    </Link>
                    <span className="text-zinc-300 dark:text-zinc-800">·</span>
                    <Link
                      href={`/contest/${contest.id}/leaderboard`}
                      className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    >
                      Leaderboard
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">No active contest</p>
                <p className="text-xs text-zinc-500">Contest management via backend API coming soon.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Announcements Tab ─────────────────────────────────────────────── */}
        {tab === 'announcements' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Post new announcement */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 space-y-4">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Post Announcement
              </h3>
              <form onSubmit={handleAnnouncement} className="space-y-3">
                <textarea
                  value={annMsg}
                  onChange={(e) => setAnnMsg(e.target.value)}
                  placeholder="Type your announcement to broadcast to all active students..."
                  rows={4}
                  required
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none resize-none transition-colors"
                />
                {annSuccess && (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    ✓ {annSuccess}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={annSending || !annMsg.trim()}
                  className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 transition-colors disabled:opacity-50"
                >
                  {annSending ? 'Posting...' : 'Broadcast to All Students'}
                </button>
              </form>
            </div>

            {/* Recent announcements */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 space-y-4">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Recent Announcements ({contest?.announcements?.length ?? 0})
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {(contest?.announcements ?? []).length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-8">No announcements posted yet.</p>
                ) : (
                  [...(contest?.announcements ?? [])].reverse().map((ann) => (
                    <div key={ann.id} className="rounded-lg border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 p-3 space-y-1">
                      <span className="text-[0.6rem] font-mono text-zinc-400">
                        {new Date(ann.timestamp).toLocaleString()}
                      </span>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">{ann.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
>>>>>>> f4becec8226ca9317ff9585eedcc5ba1074cda1d
  );
}
