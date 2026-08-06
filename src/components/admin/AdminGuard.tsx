'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

interface AdminGuardProps {
  children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <SkeletonLoader count={3} className="h-20 w-full mb-4" />
      </div>
    );
  }

  const hasAccess = isAuthenticated && user && (user.permissions?.includes('manage_problems') || user.permissions?.includes('manage_users'));

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="w-full max-w-sm font-jetbrains">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xl">
              🔒
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Admin Access Required
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                This area is restricted to faculty and administrators. Sign in with an authorized admin email to continue.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/"
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 transition-colors text-center"
              >
                Sign In as Admin
              </Link>
              <Link
                href="/problems"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-center"
              >
                Return to Student Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
