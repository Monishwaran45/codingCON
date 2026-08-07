'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { useContestStore } from '@/store/useContestStore';
import { api } from '@/lib/api';
import { Submission } from '@/types';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

export default function StudentDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const { contest, setContest } = useContestStore();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Refresh user stats whenever the page gains focus (tab switch / navigate back)
  // so Max Score and Solved count are always current after returning from a solve.
  useEffect(() => {
    const handleFocus = () => {
      if (!isAuthenticated) return;
      import('@/store/useAuthStore').then(({ useAuthStore }) => {
        useAuthStore.getState().refreshUser();
      });
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated]);

  useEffect(() => {
    async function loadDashboardData() {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        // Refresh user stats (totalPoints, solvedCount) from server on every page load
        const { useAuthStore } = await import('@/store/useAuthStore');
        await useAuthStore.getState().refreshUser();

        const activeContest = await api.getActiveContest().catch(() => null);
        if (activeContest) setContest(activeContest);
        const userSubmissions = await api.getSubmissions();
        setSubmissions(userSubmissions.slice(0, 5));
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, [isAuthenticated, setContest]);

  // ── Unauthenticated: Login Gate ─────────────────────────────────────────
  if (!isAuthenticated || !user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 font-inter relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-16 min-h-[calc(100vh-100px)] relative z-10">
          {/* Left: Information */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex-1 space-y-8 max-w-xl"
          >
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.15]">
                {process.env.NEXT_PUBLIC_APP_SHORT_NAME || 'Coding Assessment'}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">System</span>
              </h1>
              <p className="text-[0.9rem] text-zinc-500 dark:text-zinc-400 mt-5 leading-relaxed max-w-md">
                Internal coding assessment platform for {process.env.NEXT_PUBLIC_INSTITUTE_NAME || 'your institute'}. Sign in to access contests, solve problems, and track your progress.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                { label: 'Curated problem sets from past assessments and competitive practice' },
                { label: 'Real-time code evaluation with instant verdicts' },
                { label: 'Live leaderboards and performance tracking' },
              ].map(({ label }) => (
                <div key={label} className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Sign In */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full md:w-[420px] flex justify-center"
          >
            <div className="w-full relative">
              <div className="relative glass-panel rounded-2xl p-1 shadow-xl">
                <AuthForm />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Admin redirect hint
  if (user.role === 'admin' || user.role === 'problem_setter') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 font-inter text-center relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto space-y-6 glass-panel p-10 rounded-2xl"
        >
          <div className="text-5xl mb-4 animate-bounce">👋</div>
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white mb-2">
              Welcome, {user.username}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              You are signed in as <strong className="text-blue-600 dark:text-blue-400">{user.role}</strong>. Please head to the Admin Console to manage problems and monitor active contests.
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-105 font-bold text-sm px-6 py-3.5 transition-all shadow-lg"
          >
            Open Admin Dashboard →
          </Link>
        </motion.div>
      </div>
    );
  }

  // ── Authenticated Student Dashboard ────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 font-inter space-y-8">
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-6 border-b border-zinc-200/50 dark:border-zinc-800/50"
      >
        <div>
          <span className="text-[0.62rem] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-2">
            Student Console
          </span>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Welcome back, {user.username}
          </h1>
          <div className="flex items-center gap-4 mt-3 text-xs">
            <span className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
              Max Score: <strong className="font-mono text-zinc-900 dark:text-zinc-100">{user.totalPoints || 0}</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 font-semibold">
              Solved: {user.solvedCount || 0}
            </span>
          </div>
        </div>
        <Link
          href="/problems"
          className="group rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 hover:-translate-y-0.5"
        >
          Explore Problems
          <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </motion.div>

      {isLoading ? (
        <SkeletonLoader count={3} className="h-28 w-full rounded-2xl" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="lg:col-span-2 space-y-8">
            
            {/* Active Contest Banner */}
            <motion.div variants={itemVariants}>
              <h3 className="text-[0.65rem] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 px-1">
                Active Session
              </h3>
              {contest ? (
                <div className="relative group overflow-hidden rounded-2xl border border-blue-500/30 bg-blue-50 dark:bg-blue-950/20 p-6 transition-all hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-transparent blur-3xl group-hover:scale-110 transition-transform" />
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[0.62rem] font-bold px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                          LIVE
                        </span>
                        <span className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/50 px-2 rounded">{contest.id}</span>
                      </div>
                      <h4 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">{contest.title}</h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {contest.problems.length} challenges · Ends at {new Date(contest.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <Link
                      href={`/contest/${contest.id}`}
                      className="rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-3 text-xs font-bold hover:scale-105 transition-transform shadow-lg whitespace-nowrap text-center"
                    >
                      Enter Arena
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="glass-panel rounded-2xl p-8 text-center border-dashed">
                  <p className="text-xs text-zinc-500">No active assessments scheduled right now.</p>
                  <Link href="/problems" className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block font-semibold">
                    Sharpen your skills in the Problem Archive →
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Recent Submissions */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-[0.65rem] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Recent Activity
                </h3>
                <Link href="/profile" className="text-[0.65rem] font-bold text-zinc-500 hover:text-blue-600 transition-colors">
                  View All →
                </Link>
              </div>

              <div className="glass-panel rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-500 dark:text-zinc-400 uppercase text-[0.6rem] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-5 font-semibold">Problem</th>
                      <th className="py-3.5 px-5 font-semibold">Language</th>
                      <th className="py-3.5 px-5 text-center font-semibold">Runtime</th>
                      <th className="py-3.5 px-5 text-right font-semibold">Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900/60">
                    {submissions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-zinc-500 bg-zinc-50/20 dark:bg-zinc-950/20">
                          No submissions yet. Time to write some code!
                        </td>
                      </tr>
                    ) : (
                      submissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors group cursor-default">
                          <td className="py-3.5 px-5 font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{sub.problemTitle}</td>
                          <td className="py-3.5 px-5 text-zinc-500 font-mono text-[0.65rem]">{sub.language}</td>
                          <td className="py-3.5 px-5 text-center font-mono text-zinc-500 text-[0.65rem]">
                            {sub.executionTimeMs || '—'} ms
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <span className={`font-bold px-2 py-0.5 rounded text-[0.62rem] tracking-wider border ${
                              sub.verdict === 'AC'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                            }`}>
                              {sub.verdict === 'AC' ? 'Accepted' : sub.verdict}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>

          {/* Sidebar */}
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
            {/* Announcements */}
            <motion.div variants={itemVariants}>
              <h3 className="text-[0.65rem] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 px-1">
                Announcements
              </h3>
              <div className="glass-panel rounded-2xl p-5 space-y-4 max-h-[340px] overflow-y-auto">
                {contest?.announcements && contest.announcements.length > 0 ? (
                  [...contest.announcements].reverse().map((ann) => (
                    <div key={ann.id} className="relative pl-4 border-l-2 border-blue-500/30 dark:border-blue-500/50 pb-4 last:pb-0">
                      <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-white dark:ring-zinc-950" />
                      <span className="text-[0.6rem] font-mono text-zinc-400 block mb-1.5">
                        {new Date(ann.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans">{ann.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 text-center py-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">No recent broadcasts.</p>
                )}
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-5 space-y-3">
              <h4 className="text-[0.65rem] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Quick Navigate</h4>
              {[
                { href: '/problems', label: 'Problem Archive', icon: '📁' },
                { href: contest ? `/contest/${contest.id}` : '/problems', label: 'Active Contest', icon: '🔥' },
                { href: contest ? `/contest/${contest.id}/leaderboard` : '/problems', label: 'Live Leaderboard', icon: '🏆' },
                { href: '/profile', label: 'My Submissions', icon: '📜' },
              ].map(({ href, label, icon }) => (
                <Link key={label} href={href} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-xs text-zinc-700 dark:text-zinc-300 font-semibold transition-colors group">
                  <span className="text-sm grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">{icon}</span>
                  <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400">{label}</span>
                </Link>
              ))}
            </motion.div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
