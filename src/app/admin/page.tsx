'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Problem, Contest, Participant } from '@/types';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { CreateContestModal } from '@/components/admin/CreateContestModal';
import { ProblemImportModal } from '@/components/admin/ProblemImportModal';
import { ContestTimer } from '@/components/contest/ContestTimer';

type Tab = 'problems' | 'contests' | 'participants' | 'announcements';

const DIFF_STYLES = {
  easy: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
  hard: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20',
};

export default function AdminDashboardPage() {
  const [tab, setTab] = useState<Tab>('problems');
  const [problems, setProblems] = useState<Problem[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [activeContest, setActiveContest] = useState<Contest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiff, setSelectedDiff] = useState<string>('all');

  // Participants Tab State
  const [selectedContestId, setSelectedContestId] = useState<string>('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isParticipantsLoading, setIsParticipantsLoading] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');

  // Modals
  const [isContestModalOpen, setIsContestModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Announcement state
  const [annMsg, setAnnMsg] = useState('');
  const [annSending, setAnnSending] = useState(false);
  const [annSuccess, setAnnSuccess] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [probs, contList, activeCont] = await Promise.all([
        api.getProblems(),
        api.getContests().catch(() => []),
        api.getActiveContest().catch(() => null),
      ]);
      setProblems(probs);
      setContests(contList);
      setActiveContest(activeCont);
      if (contList.length > 0 && !selectedContestId) {
        setSelectedContestId(activeCont?.id || contList[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedContestId]);

  const loadParticipants = useCallback(async (contestId: string) => {
    if (!contestId) return;
    setIsParticipantsLoading(true);
    try {
      const data = await api.getContestParticipants(contestId);
      setParticipants(data);
    } catch (err) {
      console.error('Failed to load participants:', err);
      setParticipants([]);
    } finally {
      setIsParticipantsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedContestId && tab === 'participants') {
      loadParticipants(selectedContestId);
    }
  }, [selectedContestId, tab, loadParticipants]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await api.deleteProblem(id);
    setProblems((prev) => prev.filter((p) => p.id !== id));
  };

  const handleStopContest = async (contestId: string, title: string) => {
    if (!confirm(`🛑 Stop and conclude contest "${title}" now? The active timer will end immediately.`)) return;
    await api.stopContest(contestId);
    await loadData();
    if (selectedContestId === contestId) {
      loadParticipants(contestId);
    }
  };

  const handleExtendContest = async (contestId: string, title: string) => {
    await api.extendContest(contestId);
    await loadData();
  };

  const handleDeleteContest = async (contestId: string, title: string) => {
    if (!confirm(`⚠️ Permanently delete contest "${title}" and all its participant data? This action cannot be undone.`)) return;
    await api.deleteContest(contestId);
    if (selectedContestId === contestId) {
      setSelectedContestId('');
      setParticipants([]);
    }
    await loadData();
  };

  const handleViewParticipants = (contestId: string) => {
    setSelectedContestId(contestId);
    setTab('participants');
    loadParticipants(contestId);
  };

  const handleExportCSV = () => {
    if (participants.length === 0) return;
    const currentContest = contests.find(c => c.id === selectedContestId);
    const headers = ['Rank', 'Username', 'Email', 'Solved Count', 'Total Score', 'Penalty Minutes', 'Last Active'];
    const rows = participants.map(p => [
      p.rank,
      `"${p.username}"`,
      `"${p.email}"`,
      p.solvedCount,
      p.totalScore,
      p.penaltyTimeMinutes,
      `"${p.lastUpdated}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `participants_${currentContest?.title?.replace(/\s+/g, '_') || selectedContestId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleFreeze = async (contestId: string, currentFrozen: boolean) => {
    await api.freezeLeaderboard(contestId, !currentFrozen);
    loadData();
  };

  const handleAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annMsg.trim() || !activeContest) return;
    setAnnSending(true);
    await api.postAnnouncement(activeContest.id, annMsg.trim());
    setAnnSuccess('Announcement broadcasted live to all students.');
    setAnnMsg('');
    setAnnSending(false);
    setTimeout(() => setAnnSuccess(''), 4000);
    loadData();
  };

  const filteredProblems = problems.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchDiff = selectedDiff === 'all' || p.difficulty === selectedDiff;
    return matchSearch && matchDiff;
  });

  const filteredParticipants = participants.filter((p) => {
    const query = participantSearch.toLowerCase();
    return (
      p.username.toLowerCase().includes(query) ||
      p.email.toLowerCase().includes(query) ||
      String(p.rank).includes(query)
    );
  });

  const stats = [
    { label: 'Total Problems', value: problems.length, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Scheduled Contests', value: contests.length, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Live Contest Participants', value: activeContest?.participantCount ?? 0, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Broadcast Announcements', value: activeContest?.announcements?.length ?? 0, color: 'text-violet-600 dark:text-violet-400' },
  ];

  return (
    <AdminGuard>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 font-inter space-y-6">
        {/* Page Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[0.62rem] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-1">
              Faculty & Admin Control Panel
            </span>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Upload problem sets, set execution time limits, schedule contests & monitor real-time coding platform.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold px-3.5 py-2 transition-colors shadow-xs"
            >
              📥 Import JSON
            </button>
            <button
              onClick={() => setIsContestModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 transition-colors shadow-xs"
            >
              ⏱ Start Contest
            </button>
            <Link
              href="/admin/problems/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 transition-colors shadow-xs"
            >
              <span>+</span> Upload Problem
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
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {([
              { id: 'problems', label: `Problem Archive (${problems.length})`, icon: '📁' },
              { id: 'contests', label: `Contest Management (${contests.length})`, icon: '⏱' },
              { id: 'participants', label: `Participants (${participants.length})`, icon: '👥' },
              { id: 'announcements', label: 'Live Announcements', icon: '📢' },
            ] as { id: Tab; label: string; icon: string }[]).map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => {
                  setTab(id);
                  if (id === 'participants' && selectedContestId) {
                    loadParticipants(selectedContestId);
                  }
                }}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
                  tab === id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <span>{icon}</span>
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
                placeholder="Search by problem title or tag..."
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
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs font-inter">
                  <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 uppercase text-[0.65rem] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Problem</th>
                      <th className="py-3 px-4 text-center">Difficulty</th>
                      <th className="py-3 px-4 text-center">Points</th>
                      <th className="py-3 px-4 text-center">Timeout (Ms)</th>
                      <th className="py-3 px-4 text-center">Memory</th>
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
                        <td className="py-3.5 px-4 text-center font-mono text-blue-600 dark:text-blue-400 font-semibold text-[0.7rem]">
                          {problem.timeLimitMs} ms
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-zinc-500 text-[0.7rem]">
                          {problem.memoryLimitMb} MB
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-[0.62rem] font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 uppercase">
                            Active
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <Link
                              href={`/problems/${problem.id}`}
                              className="text-[0.7rem] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                            >
                              Preview
                            </Link>
                            <Link
                              href={`/admin/problems/${problem.id}/edit`}
                              className="text-[0.7rem] font-bold text-blue-600 dark:text-blue-400 hover:underline transition-colors"
                            >
                              Edit
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
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">No problems uploaded yet</p>
                <p className="text-xs text-zinc-500 mb-4">Upload your first problem or batch import via JSON.</p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300"
                  >
                    Import JSON
                  </button>
                  <Link
                    href="/admin/problems/new"
                    className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 transition-colors"
                  >
                    + Create Problem
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Contest Tab ──────────────────────────────────────────────────── */}
        {tab === 'contests' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                All Contests ({contests.length})
              </h3>
              <button
                onClick={() => setIsContestModalOpen(true)}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 transition-colors"
              >
                + Schedule & Start New Contest
              </button>
            </div>

            {isLoading ? (
              <SkeletonLoader count={3} className="h-20 w-full rounded-xl" />
            ) : contests.length > 0 ? (
              <div className="space-y-4">
                {contests.map((c) => {
                  const now = new Date();
                  const isEnded = new Date(c.endTime) < now;
                  const isUpcoming = new Date(c.startTime) > now;
                  const isLive = !isEnded && !isUpcoming;

                  return (
                    <div
                      key={c.id}
                      className={`rounded-xl border bg-white dark:bg-zinc-950 overflow-hidden shadow-xs transition-all ${
                        isLive
                          ? 'border-blue-500/40 dark:border-blue-500/30'
                          : 'border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {isLive ? (
                              <span className="text-[0.62rem] font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 uppercase inline-flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                LIVE CONTEST
                              </span>
                            ) : isUpcoming ? (
                              <span className="text-[0.62rem] font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 uppercase">
                                ⏳ UPCOMING
                              </span>
                            ) : (
                              <span className="text-[0.62rem] font-bold px-2 py-0.5 rounded bg-zinc-500/10 border border-zinc-500/20 text-zinc-500 uppercase">
                                🏁 CONCLUDED
                              </span>
                            )}
                            <span className="text-xs font-mono text-zinc-400">ID: {c.id}</span>
                          </div>
                          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{c.title}</h3>
                        </div>

                        {/* Action Buttons & Timer */}
                        <div className="flex flex-wrap items-center gap-2.5">
                          {!isEnded && (
                            <ContestTimer endTime={c.endTime} durationMinutes={c.durationMinutes} />
                          )}

                          {/* Stop Contest Button */}
                          {isLive && (
                            <button
                              onClick={() => handleStopContest(c.id, c.title)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors inline-flex items-center gap-1"
                              title="Immediately end this contest"
                            >
                              🛑 Stop Contest
                            </button>
                          )}

                          {/* Extend Timer Button */}
                          <button
                            onClick={() => handleExtendContest(c.id, c.title)}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                            title="Extend contest duration by 60 minutes"
                          >
                            ➕ {isEnded ? 'Restart (+105m)' : 'Extend (+60m)'}
                          </button>

                          {/* Freeze Leaderboard Button */}
                          <button
                            onClick={() => handleToggleFreeze(c.id, !!c.isLeaderboardFrozen)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                              c.isLeaderboardFrozen
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                                : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            {c.isLeaderboardFrozen ? '❄ Frozen' : 'Freeze'}
                          </button>

                          {/* View Participants Button */}
                          <button
                            onClick={() => handleViewParticipants(c.id)}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors inline-flex items-center gap-1"
                          >
                            👥 Participants ({c.participantCount})
                          </button>

                          {/* Delete Contest Button */}
                          <button
                            onClick={() => handleDeleteContest(c.id, c.title)}
                            className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-red-600 hover:border-red-300 dark:hover:border-red-800 transition-colors"
                            title="Delete contest and all submissions"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>

                      <div className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/30">
                        <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
                          <span>Problems included ({c.problems?.length ?? 0}):</span>
                          <span>Max Total Score: <strong className="font-mono text-zinc-800 dark:text-zinc-200">{c.maxScore} pts</strong></span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {(c.problems ?? []).map((p, i) => (
                            <span
                              key={p.id}
                              className="text-xs font-semibold px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
                            >
                              <span className="font-mono text-zinc-400 mr-1.5">{String.fromCharCode(65 + i)}:</span>
                              {p.title} ({p.points} pts)
                            </span>
                          ))}
                        </div>

                        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
                          <div className="flex items-center gap-4">
                            <Link
                              href={`/contest/${c.id}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              View Live Student Platform →
                            </Link>
                            <Link
                              href={`/contest/${c.id}/leaderboard`}
                              className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                            >
                              Live Standings Leaderboard
                            </Link>
                          </div>
                          <span className="text-[0.7rem] text-zinc-400 font-mono">
                            {new Date(c.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(c.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(c.startTime).toLocaleDateString([], { day: 'numeric', month: 'short' })})
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">No contests scheduled</p>
                <p className="text-xs text-zinc-500 mb-4">Schedule a contest to test students in real time with timed execution.</p>
                <button
                  onClick={() => setIsContestModalOpen(true)}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 transition-colors"
                >
                  + Schedule First Contest
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Participants Tab ──────────────────────────────────────────────── */}
        {tab === 'participants' && (
          <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Student Participants & Assessment Roster
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Real-time list of students registered, actively participating, or submitted for this contest.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Contest Selector Dropdown */}
                {contests.length > 0 && (
                  <select
                    value={selectedContestId}
                    onChange={(e) => {
                      setSelectedContestId(e.target.value);
                      loadParticipants(e.target.value);
                    }}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:border-blue-500 focus:outline-none"
                  >
                    {contests.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.id})
                      </option>
                    ))}
                  </select>
                )}

                {/* Export CSV Button */}
                <button
                  onClick={handleExportCSV}
                  disabled={participants.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold px-3.5 py-2 transition-colors disabled:opacity-50 shadow-xs"
                >
                  📥 Export CSV
                </button>
              </div>
            </div>

            {/* Quick Stats Banner for Selected Contest */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-4">
                <span className="text-[0.65rem] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                  Enrolled Students
                </span>
                <span className="text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
                  {participants.length}
                </span>
              </div>
              <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-4">
                <span className="text-[0.65rem] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                  Solved ≥ 1 Challenge
                </span>
                <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {participants.filter(p => p.solvedCount > 0).length}
                </span>
              </div>
              <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-4">
                <span className="text-[0.65rem] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                  Top Score Achieved
                </span>
                <span className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
                  {participants.length > 0 ? Math.max(...participants.map(p => p.totalScore)) : 0} pts
                </span>
              </div>
              <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-4">
                <span className="text-[0.65rem] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                  Average Score
                </span>
                <span className="text-2xl font-extrabold font-mono text-purple-600 dark:text-purple-400">
                  {participants.length > 0
                    ? Math.round(participants.reduce((a, b) => a + b.totalScore, 0) / participants.length)
                    : 0} pts
                </span>
              </div>
            </div>

            {/* Search filter */}
            <div className="bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
              <input
                type="text"
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                placeholder="Search participant by student name, email, or rank..."
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Participants Table */}
            {isParticipantsLoading ? (
              <SkeletonLoader count={5} className="h-14 w-full rounded-xl" />
            ) : filteredParticipants.length > 0 ? (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs font-inter">
                  <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 uppercase text-[0.65rem] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 text-center w-16">Rank</th>
                      <th className="py-3.5 px-4">Student Participant</th>
                      <th className="py-3.5 px-4 text-center">Problems Solved</th>
                      <th className="py-3.5 px-4 text-center">Score</th>
                      <th className="py-3.5 px-4 text-center">Penalty Time</th>
                      <th className="py-3.5 px-4">Problem Breakdown</th>
                      <th className="py-3.5 px-4 text-right">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                    {filteredParticipants.map((p) => {
                      const breakdownEntries = Object.entries(p.problemBreakdown || {});
                      return (
                        <tr key={p.userId} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                          <td className="py-3.5 px-4 text-center font-mono font-bold">
                            {p.rank === 1 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-xs">
                                🥇 1
                              </span>
                            ) : p.rank === 2 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs">
                                🥈 2
                              </span>
                            ) : p.rank === 3 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-200/50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-500 text-xs">
                                🥉 3
                              </span>
                            ) : (
                              <span className="text-zinc-500 dark:text-zinc-400">#{p.rank}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                                {p.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                  {p.username}
                                  <span className="text-[0.6rem] font-normal px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border border-zinc-200/60 dark:border-zinc-800">
                                    {p.role}
                                  </span>
                                </div>
                                <div className="text-[0.7rem] text-zinc-400 font-mono">{p.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                              {p.solvedCount}
                            </span>
                            <span className="text-zinc-400 text-[0.7rem]"> solved</span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {p.totalScore}
                            <span className="text-[0.65rem] text-zinc-400 font-normal ml-0.5">pts</span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-zinc-500 text-xs">
                            {p.penaltyTimeMinutes}m
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1.5">
                              {breakdownEntries.length > 0 ? (
                                breakdownEntries.map(([probId, data]) => (
                                  <span
                                    key={probId}
                                    className={`text-[0.62rem] font-mono px-2 py-0.5 rounded border ${
                                      data.score > 0
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold'
                                        : data.attempted
                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-800'
                                    }`}
                                  >
                                    {data.score > 0 ? `+${data.score}` : (data.attempted ? 'Att' : '—')}
                                  </span>
                                ))
                              ) : (
                                <span className="text-zinc-400 text-[0.7rem] italic">No submissions yet</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right text-[0.7rem] text-zinc-400 font-mono">
                            {new Date(p.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
                <div className="text-3xl mb-3">👥</div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  No participants registered yet
                </p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  When students log in and enter the assessment arena, their names, scores, and real-time solved challenge breakdown will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Announcements Tab ─────────────────────────────────────────────── */}
        {tab === 'announcements' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Post new announcement */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Broadcast Real-Time Announcement
              </h3>
              <form onSubmit={handleAnnouncement} className="space-y-3">
                <textarea
                  value={annMsg}
                  onChange={(e) => setAnnMsg(e.target.value)}
                  placeholder="Type your announcement (e.g., 'Clarity on Problem B: 1-indexed input format')..."
                  rows={4}
                  required
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none resize-none transition-colors"
                />
                {annSuccess && (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    ✓ {annSuccess}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={annSending || !annMsg.trim() || !activeContest}
                  className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 transition-colors disabled:opacity-50"
                >
                  {annSending ? 'Broadcasting...' : 'Broadcast to Active Contest Platform'}
                </button>
              </form>
            </div>

            {/* Recent announcements */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Recent Broadcasts ({activeContest?.announcements?.length ?? 0})
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {(activeContest?.announcements ?? []).length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-8">No announcements broadcasted yet.</p>
                ) : (
                  [...(activeContest?.announcements ?? [])].reverse().map((ann) => (
                    <div key={ann.id} className="rounded-lg border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 p-3.5 space-y-1">
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

        {/* Modals */}
        <CreateContestModal
          isOpen={isContestModalOpen}
          onClose={() => setIsContestModalOpen(false)}
          onSuccess={loadData}
          availableProblems={problems}
        />
        <ProblemImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={loadData}
        />
      </div>
    </AdminGuard>
  );
}
