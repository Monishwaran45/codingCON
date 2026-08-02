'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();

  const navLinks = [
    { href: '/problems', label: 'Problems' },
    { href: '/contest/c88', label: 'Contest' },
    { href: '/profile', label: 'Profile' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-900 bg-black">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-zinc-800 shadow-[0_0_10px_rgba(255,255,255,0.05)] group-hover:scale-105 transition-transform duration-200">
            <span className="font-jetbrains font-extrabold text-sm text-black">C</span>
          </div>
          <div className="flex flex-col">
            <span className="font-jetbrains text-sm font-extrabold tracking-wider text-white">
              CODING<span className="text-cyan-400">CON</span>
            </span>
            <span className="text-[0.6rem] font-bold text-zinc-500 tracking-widest uppercase">
              Arena
            </span>
          </div>
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-1 rounded-full bg-zinc-950 p-1 border border-zinc-900">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'font-jetbrains text-[0.7rem] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full transition-all duration-150',
                  isActive
                    ? 'bg-white text-black font-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Admin Actions */}
        <div className="flex items-center gap-2.5 font-jetbrains">
          <Link
            href="/admin"
            className={cn(
              'text-[0.68rem] font-bold border px-3 py-1.5 rounded-lg transition-colors',
              pathname.startsWith('/admin')
                ? 'border-cyan-400 bg-cyan-500/10 text-cyan-400'
                : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-700'
            )}
          >
            ⚙️ Admin Panel
          </Link>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1 hover:border-zinc-700 transition-colors"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded bg-purple-500 font-bold text-xs text-white">
                  {user.username[0].toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[0.7rem] font-bold text-white leading-none mb-0.5">
                    {user.username}
                  </span>
                  <span className="text-[0.62rem] text-cyan-400 font-extrabold leading-none">
                    {user.rating} PTS
                  </span>
                </div>
              </Link>
              <button
                onClick={() => logout()}
                className="text-[0.68rem] font-bold text-red-400 hover:text-red-300 border border-red-900/60 bg-red-950/40 rounded-lg px-2.5 py-1.5 transition-colors"
                title="Log Out"
              >
                LOG OUT
              </button>
            </div>
          ) : (
            <Link
              href="/"
              className="text-xs font-bold text-white border border-white rounded px-4 py-1.5 hover:bg-white hover:text-black transition-colors duration-150"
            >
              SIGN IN
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
