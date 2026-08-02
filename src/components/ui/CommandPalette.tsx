'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { Problem } from '@/types';

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      api.getProblems().then(setProblems).catch(console.error);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const quickLinks = useMemo(() => {
    const links = [
      { id: 'dash', title: 'Dashboard', category: 'Navigation', href: '/' },
      { id: 'probs', title: 'Problem Bank', category: 'Navigation', href: '/problems' },
      { id: 'profile', title: 'My Profile & Submissions', category: 'Navigation', href: '/profile' },
    ];
    if (user?.role === 'admin' || user?.role === 'problem_setter') {
      links.push({ id: 'admin', title: 'Admin Console', category: 'Faculty', href: '/admin' });
      links.push({ id: 'new-prob', title: '+ Create New Problem', category: 'Faculty', href: '/admin/problems/new' });
    }
    return links;
  }, [user]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      return [
        ...quickLinks,
        ...problems.slice(0, 5).map((p) => ({
          id: p.id,
          title: `${p.title} (${p.difficulty.toUpperCase()})`,
          category: 'Problems',
          href: `/problems/${p.id}`,
        })),
      ];
    }

    const q = query.toLowerCase();
    const navMatches = quickLinks.filter((item) => item.title.toLowerCase().includes(q));
    const probMatches = problems
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 8)
      .map((p) => ({
        id: p.id,
        title: `${p.title} [${p.points} PTS]`,
        category: 'Problems',
        href: `/problems/${p.id}`,
      }));

    return [...navMatches, ...probMatches];
  }, [query, quickLinks, problems]);

  const handleSelect = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex].href);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-zinc-950/60 backdrop-blur-sm transition-opacity">
      <div
        className="w-full max-w-xl rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden font-jetbrains animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Box */}
        <div className="flex items-center px-4 border-b border-zinc-200 dark:border-zinc-800">
          <svg className="w-4 h-4 text-zinc-400 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search problems..."
            className="w-full py-3.5 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
            autoFocus
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[0.65rem] font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded bg-zinc-100 dark:bg-zinc-800">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No matching problems or commands found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={`${item.id}-${idx}`}
                  onClick={() => handleSelect(item.href)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs transition-colors text-left ${
                    isSelected
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className={`text-[0.6rem] font-mono uppercase px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-blue-700 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {item.category}
                    </span>
                    <span className="truncate">{item.title}</span>
                  </div>
                  <span className={`text-[0.65rem] font-mono ${isSelected ? 'text-blue-200' : 'text-zinc-400'}`}>
                    Select ↵
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 dark:bg-zinc-950/80 border-t border-zinc-200 dark:border-zinc-800 text-[0.65rem] text-zinc-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded">↑</kbd>{' '}
              <kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded">↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded">↵</kbd> Select
            </span>
          </div>
          <span>CIT Chennai Assessment Portal</span>
        </div>
      </div>
    </div>
  );
};
