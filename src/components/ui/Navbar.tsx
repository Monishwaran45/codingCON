'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  const navLinks = [
    { href: '/problems', label: 'Problems' },
    { href: '/contest/c88', label: 'Contest #88' },
    { href: '/profile', label: 'Profile' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="font-jetbrains flex items-center justify-center rounded bg-cyan-500/10 px-2 py-1 text-sm font-bold text-cyan-400 border border-cyan-500/30 group-hover:border-cyan-400 transition-colors">
            &lt;/&gt;
          </div>
          <span className="font-jetbrains text-lg font-extrabold tracking-tight text-slate-100">
            coding<span className="text-cyan-400">CON</span>
          </span>
          <span className="font-jetbrains text-[0.65rem] font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
            LIVE
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-1 rounded-full bg-slate-900/60 p-1 border border-slate-800">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'font-jetbrains text-xs font-semibold px-4 py-1.5 rounded-full transition-all duration-150',
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User Profile / Auth Action */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <Link
              href="/profile"
              className="flex items-center gap-2.5 rounded-full border border-slate-800 bg-slate-900/80 py-1 pl-1.5 pr-3 hover:border-slate-700 transition-colors"
            >
              <div className="font-jetbrains flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 font-bold text-xs text-white">
                {user.username[0].toUpperCase()}
              </div>
              <div className="flex flex-col text-left">
                <span className="font-jetbrains text-xs font-semibold text-slate-200">
                  {user.username}
                </span>
                <span className="font-jetbrains text-[0.65rem] text-cyan-400 font-medium">
                  {user.rating} pts
                </span>
              </div>
            </Link>
          ) : (
            <Link
              href="/"
              className="font-jetbrains text-xs font-semibold text-cyan-400 hover:underline"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
