import React from 'react';
import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';

export default function LandingPage() {
  return (
    <div className="relative flex min-h-[calc(100vh-65px)] flex-col items-center justify-center px-4 py-12">
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center">
        {/* Main Heading */}
        <h1 className="font-jetbrains text-4xl font-extrabold tracking-tight text-slate-100 sm:text-5xl md:text-6xl mb-4">
          Competitive Coding. <br />
          <span className="text-cyan-400">
            Real-Time Tension & Feedback.
          </span>
        </h1>

        <p className="max-w-xl text-xs text-slate-400 mb-8 leading-relaxed">
          Master algorithms with sandboxed evaluation, live testcase streaming, and loss-averse rank leaderboards.
        </p>

        {/* Single Primary CTA above fold */}
        <div className="flex items-center gap-4 mb-10">
          <Link
            href="/problems"
            className="font-jetbrains flex items-center gap-2 rounded-xl bg-cyan-500 px-8 py-3.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/10 hover:bg-cyan-400 transition-all duration-150 transform hover:-translate-y-0.5"
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
