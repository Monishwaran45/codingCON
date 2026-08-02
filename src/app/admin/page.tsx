'use client';

import React from 'react';
import Link from 'next/link';


export default function AdminDashboardPage() {
  return (
    <>
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
    </>
  );
}
