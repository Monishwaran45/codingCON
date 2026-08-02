import React from 'react';
import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';
import { LiveStatTicker } from '@/components/landing/LiveStatTicker';

export default function LandingPage() {
  return (
    <div className="relative flex min-h-[calc(100vh-65px)] flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center">
        {/* Social Proof Live Stat Ticker */}
        <div className="mb-8">
          <LiveStatTicker />
        </div>

        {/* Main Heading */}
        <h1 className="font-jetbrains text-4xl font-extrabold tracking-tight text-slate-100 sm:text-5xl md:text-6xl mb-4">
          Competitive Coding. <br />
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
            Real-Time Tension & Feedback.
          </span>
        </h1>

        <p className="max-w-2xl text-sm sm:text-base text-slate-400 mb-8 leading-relaxed">
          Master algorithms with Docker-sandboxed evaluation, live WebSocket testcase streaming, and loss-averse rank leaderboards.
        </p>

        {/* Single Primary CTA above fold */}
        <div className="flex items-center gap-4 mb-12">
          <Link
            href="/problems"
            className="font-jetbrains flex items-center gap-2 rounded-xl bg-cyan-500 px-8 py-4 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/20 hover:bg-cyan-400 hover:shadow-cyan-400/30 transition-all duration-150 transform hover:-translate-y-0.5"
          >
            Start Solving Now
            <svg className="h-4 w-4 stroke-current" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        {/* Auth Box */}
        <AuthForm />
      </div>
    </div>
  );
}
