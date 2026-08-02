'use client';

import React from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

interface AdminGuardProps {
  children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <SkeletonLoader count={3} className="h-20 w-full mb-4" />
      </div>
    );
  }

  // Access Denied Shield: Calm, minimal, academic restriction message
  if (!isAuthenticated || !user || user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center font-jetbrains">
        <div className="rounded-md border border-zinc-800 bg-zinc-950 p-6 space-y-4">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded bg-red-650/10 border border-red-500/20 text-red-400 text-sm font-bold">
            ⚠️
          </div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Restricted Administration Console</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Authorized personnel only. Contact the course instructor if you require access to the assessment management system.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block rounded border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-850 hover:text-white transition-colors"
            >
              Return to Student Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
