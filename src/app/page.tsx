import React from 'react';
import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-12 min-h-[calc(100vh-65px)]">
      {/* Left Column: Heading and Quick Access Hub */}
      <div className="flex-1 space-y-8 text-left max-w-xl">
        <div className="space-y-4">
          <h1 className="font-jetbrains text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            CODING<span className="text-zinc-500">CON</span>
          </h1>
          <p className="text-zinc-400 text-xs tracking-wider uppercase font-jetbrains">
            Competitive Programming Arena
          </p>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-md">
            Evaluate code in real-time, compete in live dynamic contests, and track your metrics. Clean, minimalist, and pure.
          </p>
        </div>

        {/* Quick Access Boxes with vibrant matching/contrasting colors */}
        <div className="space-y-3 font-jetbrains">
          {/* Problems Card */}
          <Link
            href="/problems"
            className="group block rounded-xl border border-zinc-800 bg-zinc-950 p-4 hover:border-emerald-500/50 hover:bg-zinc-900/40 transition-all duration-150"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[0.62rem] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  PROBLEMS
                </span>
                <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Challenge Archive
                </span>
              </div>
              <span className="text-zinc-600 text-xs">→</span>
            </div>
            <p className="text-[0.68rem] text-zinc-500 mt-1">
              Browse algorithm problems and submit solutions.
            </p>
          </Link>

          {/* Contest Card */}
          <Link
            href="/contest/c88"
            className="group block rounded-xl border border-zinc-800 bg-zinc-950 p-4 hover:border-pink-500/50 hover:bg-zinc-900/40 transition-all duration-150"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[0.62rem] font-bold px-2 py-0.5 rounded-md bg-pink-500/10 border border-pink-500/30 text-pink-400">
                  CONTEST
                </span>
                <span className="text-xs font-bold text-white group-hover:text-pink-400 transition-colors">
                  Active Contest #88
                </span>
              </div>
              <span className="text-zinc-600 text-xs">→</span>
            </div>
            <p className="text-[0.68rem] text-zinc-500 mt-1">
              Join active rounds and compete against live coders.
            </p>
          </Link>

          {/* Profile Card */}
          <Link
            href="/profile"
            className="group block rounded-xl border border-zinc-800 bg-zinc-950 p-4 hover:border-cyan-500/50 hover:bg-zinc-900/40 transition-all duration-150"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[0.62rem] font-bold px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  PROFILE
                </span>
                <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                  Coder Statistics
                </span>
              </div>
              <span className="text-zinc-600 text-xs">→</span>
            </div>
            <p className="text-[0.68rem] text-zinc-500 mt-1">
              View your rating chart, solved stats, and active streaks.
            </p>
          </Link>
        </div>
      </div>

      {/* Right Column: High-contrast AuthForm */}
      <div className="w-full md:w-auto flex justify-center">
        <AuthForm />
      </div>
    </div>
  );
}
