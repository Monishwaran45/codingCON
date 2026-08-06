'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';

const LogoIcon: React.FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="url(#brandGradient)" />
    <path d="M8 22L14 10L20 18L24 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="24" cy="12" r="2.5" fill="white" />
    <defs>
      <linearGradient id="brandGradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2563EB" />
        <stop offset="1" stopColor="#4F46E5" />
      </linearGradient>
    </defs>
  </svg>
);

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const currentTheme = mounted ? (theme as 'light' | 'dark') : 'dark';

  const isAdmin = user?.role === 'admin' || user?.role === 'problem_setter';

  // ── Admin Portal Header ───────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    return (
      <header className="sticky top-0 z-40 w-full glass-panel border-x-0 border-t-0 font-inter">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 h-14 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="transition-transform group-hover:scale-105">
              <LogoIcon className="h-6 w-6 shadow-md shadow-blue-500/20 rounded-lg" />
            </div>
            <span className="text-[0.9rem] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              CodingCON <span className="text-gradient">Admin</span>
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            {[
              { href: '/admin', label: 'Dashboard', exact: true },
              { href: '/admin/problems/new', label: '+ New Problem' },
            ].map(({ href, label, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className="relative px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
                >
                  <span className={cn("relative z-10", active ? "text-blue-700 dark:text-blue-300" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100")}>
                    {label}
                  </span>
                  {active && (
                    <motion.div
                      layoutId="adminNavIndicator"
                      className="absolute inset-0 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 rounded-md"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
            <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-2" />
            <Link
              href="/problems"
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors flex items-center gap-1 group"
            >
              Student View 
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeButton theme={currentTheme} mounted={mounted} onToggle={toggleTheme} />
            <button
              onClick={() => logout()}
              className="text-xs font-bold text-zinc-500 hover:text-red-500 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
    );
  }

  // ── Student / Public Header ───────────────────────────────────────────────
  const studentLinks = [
    { href: '/', label: 'Home', exact: true },
    { href: '/problems', label: 'Problems' },
    { href: '/contest/c88', label: 'Contest' },
    { href: '/profile', label: 'Profile' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-x-0 border-t-0 font-inter">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 h-14 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="transition-transform group-hover:scale-105">
            <LogoIcon className="h-6 w-6 shadow-md shadow-blue-500/20 rounded-lg" />
          </div>
          <span className="text-[0.9rem] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Coding<span className="text-gradient">CON</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {studentLinks.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className="relative px-3 py-1.5 text-xs font-semibold rounded-md transition-colors group"
              >
                <span className={cn("relative z-10 transition-colors", active ? "text-blue-700 dark:text-blue-300" : "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100")}>
                  {label}
                </span>
                {active && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute inset-0 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 rounded-md"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {!active && (
                  <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800/50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </Link>
            );
          })}
          
          {isAdmin && (
            <>
              <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />
              <Link
                href="/admin"
                className="relative px-3 py-1.5 text-xs font-semibold rounded-md transition-colors text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-transparent hover:border-amber-200 dark:hover:border-amber-900/50"
              >
                Admin
              </Link>
            </>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Ctrl+K Search */}
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
            className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-all hover:shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search</span>
            <kbd className="text-[0.6rem] bg-zinc-100/80 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-1 text-zinc-500 font-mono">⌘K</kbd>
          </button>

          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />

          <ThemeButton theme={currentTheme} mounted={mounted} onToggle={toggleTheme} />

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 pl-1">
              <Link
                href="/profile"
                className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group"
              >
                <div className="relative">
                  <span className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white text-[0.65rem] flex items-center justify-center font-bold shadow-md shadow-blue-500/20 ring-2 ring-transparent group-hover:ring-blue-200 dark:group-hover:ring-blue-900/50 transition-all">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-zinc-950"></span>
                </div>
                <span className="hidden sm:block">{user.username}</span>
              </Link>
            </div>
          ) : (
            <Link
              href="/"
              className="text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-4 py-1.5 rounded-lg transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

const ThemeButton: React.FC<{ theme: 'light' | 'dark'; mounted: boolean; onToggle: () => void }> = ({ theme, mounted, onToggle }) => (
  <button
    onClick={onToggle}
    aria-label="Toggle theme"
    className="flex items-center justify-center w-8 h-8 rounded-md border border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
  >
    {!mounted ? (
      <div className="w-4 h-4" />
    ) : (
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'light' ? (
          <motion.svg
            key="light"
            initial={{ opacity: 0, rotate: -45 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 45 }}
            transition={{ duration: 0.2 }}
            className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </motion.svg>
        ) : (
          <motion.svg
            key="dark"
            initial={{ opacity: 0, rotate: -45 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 45 }}
            transition={{ duration: 0.2 }}
            className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
          </motion.svg>
        )}
      </AnimatePresence>
    )}
  </button>
);
