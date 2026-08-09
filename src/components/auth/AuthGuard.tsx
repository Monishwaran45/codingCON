'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

interface AuthGuardProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallbackTitle = 'Sign In Required',
  fallbackMessage = 'Please sign in with your student or faculty account to access problems, submit solutions, and participate in coding contests.',
}) => {
  const { isAuthenticated, isLoading, mounted } = useAuth();

  if (!mounted || isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <SkeletonLoader count={3} className="h-20 w-full mb-4 rounded-xl" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[65vh] px-4 font-inter">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 text-center space-y-5 shadow-lg">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl shadow-inner">
              🔒
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {fallbackTitle}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed max-w-xs mx-auto">
                {fallbackMessage}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold py-3 px-6 transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/40"
              >
                Sign In to Platform →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
