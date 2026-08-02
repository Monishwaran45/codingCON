'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export const AuthForm: React.FC = () => {
  const router = useRouter();
  const { login, loginWithOAuth, isLoading } = useAuthStore();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleOAuth = async (provider: 'google' | 'github') => {
    await loginWithOAuth(provider);
    router.push('/problems');
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await login(email);
    router.push('/problems');
  };

  return (
    <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-black p-6 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
      <div className="text-left mb-6 font-jetbrains">
        <h2 className="text-sm font-extrabold tracking-wider text-white uppercase">
          Enter the Coding Arena
        </h2>
        <p className="text-[0.68rem] text-zinc-500 mt-1">
          Access problems, real-time evaluation, and the standings leaderboard.
        </p>
      </div>

      {/* Primary CTAs: OAuth Buttons */}
      <div className="space-y-2">
        <button
          onClick={() => handleOAuth('github')}
          disabled={isLoading}
          className="font-jetbrains w-full flex items-center justify-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-[0.72rem] font-bold text-white hover:bg-zinc-900 transition-colors"
        >
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          GITHUB
        </button>

        <button
          onClick={() => handleOAuth('google')}
          disabled={isLoading}
          className="font-jetbrains w-full flex items-center justify-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-[0.72rem] font-bold text-white hover:bg-zinc-900 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          GOOGLE
        </button>
      </div>

      {/* Secondary Option: Email / Password */}
      <div className="mt-5 text-center">
        {!showEmailForm ? (
          <button
            onClick={() => setShowEmailForm(true)}
            className="font-jetbrains text-[0.65rem] text-zinc-500 hover:text-white transition-colors"
          >
            Or authenticate with email & password →
          </button>
        ) : (
          <form onSubmit={handleEmailSubmit} className="space-y-3 pt-1 text-left font-jetbrains">
            <div>
              <label className="text-[0.62rem] uppercase tracking-wider text-zinc-500 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-700 focus:border-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[0.62rem] uppercase tracking-wider text-zinc-500 block mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-700 focus:border-white focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-white py-2 text-xs font-extrabold text-black hover:bg-zinc-200 transition-colors"
            >
              SIGN IN
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
