'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export const AuthForm: React.FC = () => {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim()) {
      setLocalError('Email is required.');
      return;
    }

    try {
      await login(email.trim(), password);

      // Check if login was successful before navigating
      const { user, isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated || !user) {
        setLocalError('Login failed. Please check your credentials.');
        return;
      }

      if (user.role === 'admin' || user.role === 'problem_setter') {
        router.push('/admin');
      } else {
        router.push('/problems');
      }
    } catch {
      setLocalError('An error occurred during sign in. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-sm font-inter">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-900">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Sign in to CodingCON
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Use your college email to access the assessment platform.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="auth-email" className="text-[0.7rem] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setLocalError(''); }}
              placeholder="you@cit.edu"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="text-[0.7rem] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLocalError(''); }}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            />
          </div>

          {(localError || error) && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
              <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>{localError || error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer note */}
        <div className="px-6 pb-5">
          <p className="text-[0.65rem] text-zinc-400 text-center leading-relaxed">
            Demo access: use <code className="font-mono bg-zinc-100 dark:bg-zinc-900 px-1 rounded text-zinc-600 dark:text-zinc-300">admin@cit.edu</code>
            {' '}or any email to sign in.
          </p>
        </div>
      </div>
    </div>
  );
};
