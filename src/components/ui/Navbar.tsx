'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { useContestStore } from '@/store/useContestStore';

const ButterflyLogo: React.FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 10C12 7 9.5 3 6.5 3 4 3 2 5 2 7.5c0 3.5 3 5.5 6 5.5.8 0 1.5-.2 2.2-.6L12 10z" opacity="0.9" />
    <path d="M12 10c0-3 2.5-7 5.5-7 2.5 0 4.5 2 4.5 4.5 0 3.5-3 5.5-6 5.5-.8 0-1.5-.2-2.2-.6L12 10z" opacity="0.9" />
    <path d="M12 12c-.7.6-1.4 1-2.2 1-2 0-3.8-1.5-3.8-3.5 0-1.5 1-2.5 2.2-2.5 1.5 0 3.3 2 3.8 5z" opacity="0.75" />
    <path d="M12 12c.7.6 1.4 1 2.2 1 2 0 3.8-1.5 3.8-3.5 0-1.5-1-2.5-2.2-2.5-1.5 0-3.3 2-3.8 5z" opacity="0.75" />
    <path d="M11.5 5c0-.3.2-.5.5-.5s.5.2.5.5v12c0 .3-.2.5-.5.5s-.5-.2-.5-.5V5z" />
    <path d="M12 5c-.3-.3-.8-1-1.5-1.2-.3-.1-.5-.4-.4-.7.1-.3.4-.5.7-.4C11.8 3 12.3 3.8 12.5 4.2c.2-.4.7-1.2 1.7-1.5.3-.1.6.1.7.4s-.1.6-.4.7c-.7.2-1.2.9-1.5 1.2" />
  </svg>
);

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { contest } = useContestStore();

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    const timer = setTimeout(() => {
      setTheme(isDark ? 'dark' : 'light');
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', nextTheme);
  };

  const themeToggleBtn = (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      )}
    </button>
  );

  // Admin Portal Header
  if (pathname.startsWith('/admin')) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-jetbrains transition-colors duration-150">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2 group">
            <ButterflyLogo className="h-5 w-5 text-blue-600" />
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-wide uppercase">
              CIT Chennai Admin <span className="text-zinc-400 dark:text-zinc-500">| College</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              href="/admin"
              className={cn(
                'text-xs font-semibold px-3 py-1.5 rounded-md transition-colors',
                pathname === '/admin'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              )}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/problems/new"
              className={cn(
                'text-xs font-semibold px-3 py-1.5 rounded-md transition-colors',
                pathname === '/admin/problems/new'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              )}
            >
              + Create Problem
            </Link>
            <Link
              href="/problems"
              className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 px-3 py-1.5 transition-colors"
            >
              Student Portal →
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            {themeToggleBtn}
            <button
              onClick={() => logout()}
              className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-md px-3 py-1.5 transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>
    );
  }

  // Student Navigation — Exactly 5 Items
  const contestPath = contest?.id ? `/contest/${contest.id}` : '/contest/active';
  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: contestPath, label: 'Contests' },
    { href: '/problems', label: 'Problems' },
    { href: '/profile', label: 'Submissions' },
    { href: '/profile', label: 'Profile' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md font-jetbrains transition-colors duration-150">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6">
        {/* Brand Header */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-1 rounded bg-blue-50 dark:bg-blue-950/50 border border-blue-200/50 dark:border-blue-800/50 group-hover:scale-105 transition-transform">
            <ButterflyLogo className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 tracking-wider uppercase">
              CIT Chennai <span className="text-blue-600 dark:text-blue-400 font-black">CodingCON</span>
            </span>
            <span className="text-[0.62rem] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Exam Live
            </span>
          </div>
        </Link>

        {/* Navigation Bar */}
        <nav className="flex items-center gap-1 border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/60 dark:bg-zinc-900/60 rounded-lg p-1">
          {navLinks.map((link, idx) => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={idx}
                href={link.href}
                className={cn(
                  'text-xs font-semibold px-3 py-1 rounded-md transition-all duration-150',
                  isActive
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200/50 dark:border-zinc-700/50'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Info & Search trigger */}
        <div className="flex items-center gap-2.5">
          {/* Ctrl+K Quick Command Button */}
          <button
            onClick={() => {
              const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true });
              window.dispatchEvent(event);
            }}
            className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-xs text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search...</span>
            <kbd className="text-[0.6rem] font-mono border border-zinc-200 dark:border-zinc-700 rounded px-1 py-0.2 bg-zinc-100 dark:bg-zinc-800">
              Ctrl K
            </kbd>
          </button>

          {themeToggleBtn}

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-200 hover:border-zinc-350 dark:hover:border-zinc-700 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-semibold">{user.username}</span>
                <span className="text-[0.6rem] text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wider">{user.role}</span>
              </Link>
              <button
                onClick={() => logout()}
                className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 px-2 py-1 transition-colors"
              >
                Log Out
              </button>
            </div>
          ) : (
            <Link
              href="/"
              className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-md px-3.5 py-1.5 transition-colors shadow-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

