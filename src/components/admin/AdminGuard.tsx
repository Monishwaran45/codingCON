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

  // Access Denied shield if not authenticated or role is not admin
  if (!isAuthenticated || !user || user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center font-jetbrains">
        <div className="rounded-2xl border border-red-900/60 bg-red-950/20 p-8 shadow-2xl space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xl font-bold">
            🔒
          </div>
          <h2 className="text-lg font-extrabold text-white">Admin Access Restricted</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            You must be authenticated with an <strong className="text-white">Administrator</strong> role to access the Instructor Portal.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/"
              className="inline-block rounded-xl bg-white px-5 py-2.5 text-xs font-extrabold text-black hover:bg-zinc-200 transition-colors"
            >
              Return to Public Platform
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
