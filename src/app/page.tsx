'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuthStore } from '@/store/useAuthStore';
import { useContestStore } from '@/store/useContestStore';
import { api } from '@/lib/api';
import { Submission } from '@/types';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

export default function StudentDashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { contest, setContest } = useContestStore();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        // Fetch active contest c88 by default as the official examination round
        const activeContest = await api.getContest('c88');
        if (activeContest) {
          setContest(activeContest);
        }
        
        // Fetch student's recent submissions
        const userSubmissions = await api.getSubmissions();
        setSubmissions(userSubmissions.slice(0, 5)); // show latest 5
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, [isAuthenticated, setContest]);

  // Unauthenticated View: Clean, official college gate
  if (!isAuthenticated || !user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-12 min-h-[calc(100vh-65px)] font-jetbrains">
        {/* Left Column: Official Assessment Instructions */}
        <div className="flex-1 space-y-6 max-w-xl">
          <div className="space-y-2">
            <span className="text-[0.65rem] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest">
              Official Examination Portal
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              College Programming Assessment System
            </h1>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 rounded-md p-5 space-y-4">
            <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Candidate Instructions
            </h3>
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2.5 list-disc list-inside">
              <li>Enter your registered college email to receive login credentials.</li>
              <li>Assessment sessions are scheduled and monitored by course faculty.</li>
              <li>Unauthorized browser tab switching may result in session termination.</li>
              <li>Ensure steady internet connectivity before starting any scheduled round.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Auth Sign In Gate */}
        <div className="w-full md:w-auto flex justify-center">
          <AuthForm />
        </div>
      </div>
    );
  }

  // Authenticated View: Distraction-free Student Dashboard
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 font-jetbrains space-y-8">
      {/* Welcome Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[0.65rem] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider block mb-1">
            Student Assessment Console
          </span>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Welcome back, {user.username}</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Course Role: <span className="text-zinc-650 dark:text-zinc-300 uppercase">{user.role}</span> | College Portal Session Active
          </p>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-[0.65rem] text-zinc-500 uppercase block">Active Course Rating</span>
          <span className="text-sm font-bold text-blue-500 dark:text-blue-400">{user.rating} PTS</span>
        </div>
      </div>

      {isLoading ? (
        <SkeletonLoader count={3} className="h-28 w-full" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Active & Upcoming Contests */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                Active Assessment Session
              </h3>
              {contest ? (
                <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[0.62rem] font-bold px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 uppercase tracking-widest inline-block mb-2">
                        LIVE EXAM
                      </span>
                      <h4 className="text-md font-bold text-zinc-800 dark:text-zinc-100">{contest.title}</h4>
                      <p className="text-xs text-zinc-500 mt-1">
                        Ensure all answers are submitted before the timer expires.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-900">
                    <span className="text-xs text-zinc-650 dark:text-zinc-400">
                      Problems Allocated: <strong className="text-zinc-800 dark:text-zinc-200">{contest.problems.length}</strong>
                    </span>
                    <Link
                      href={`/contest/${contest.id}`}
                      className="rounded bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
                    >
                      Enter Assessment
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/40 p-6 text-center">
                  <p className="text-xs text-zinc-500">No active assessments are currently running.</p>
                </div>
              )}
            </div>

            {/* Recent Assessments / Submissions */}
            <div>
              <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                Recent Submissions
              </h3>
              <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 uppercase text-[0.65rem] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">Problem</th>
                      <th className="py-2.5 px-4">Language</th>
                      <th className="py-2.5 px-4 text-center">Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-zinc-500 text-xs">
                          No recent submissions found.
                        </td>
                      </tr>
                    ) : (
                      submissions.map((sub) => (
                        <tr key={sub.id} className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                          <td className="py-2.5 px-4 font-semibold text-zinc-800 dark:text-zinc-200">{sub.problemTitle}</td>
                          <td className="py-2.5 px-4 text-zinc-500 font-mono">{sub.language}</td>
                          <td className="py-2.5 px-4 text-center">
                            <span
                              className={`font-bold px-2 py-0.5 rounded text-[0.62rem] ${
                                sub.verdict === 'AC'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20'
                              }`}
                            >
                              {sub.verdict === 'AC' ? 'ACCEPTED' : 'WRONG ANSWER'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar: Announcements */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                Official Announcements
              </h3>
              <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 space-y-4 max-h-[350px] overflow-y-auto">
                {contest?.announcements && contest.announcements.length > 0 ? (
                  contest.announcements.map((ann) => (
                    <div key={ann.id} className="border-b border-zinc-100 dark:border-zinc-900 pb-3 last:border-0 last:pb-0">
                      <span className="text-[0.6rem] text-zinc-400 dark:text-zinc-500 block mb-1">
                        {new Date(ann.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">{ann.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 text-center py-4">No new announcements posted.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
