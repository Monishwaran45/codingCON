'use client';

import React, { useState } from 'react';
import { LeaderboardEntry } from '@/types';
import { LeaderboardRow } from './LeaderboardRow';
import { StickyUserRow } from './StickyUserRow';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId: string;
  isFrozen?: boolean;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  entries,
  currentUserId,
  isFrozen = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const userIndex = entries.findIndex((e) => e.userId === currentUserId);
  const currentUserRow = userIndex !== -1 ? entries[userIndex] : null;
  const nextRankRow = userIndex > 0 ? entries[userIndex - 1] : null;
  const deltaPointsToPass = (currentUserRow && nextRankRow) ? (nextRankRow.totalScore - currentUserRow.totalScore) : 0;

  const filteredEntries = entries.filter((e) =>
    e.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(e.rank).includes(searchQuery)
  );

  return (
    <div className="space-y-4 pb-20 font-inter">
      {/* Freeze Banner if frozen */}
      {isFrozen && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center text-xs text-amber-600 dark:text-amber-400 font-bold">
          ❄️ LEADERBOARD FROZEN UNTIL CONTEST ENDS — Scores are temporarily hidden.
        </div>
      )}

      {/* Toolbar Search & Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search competitor by username or rank..."
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          Showing <strong className="text-zinc-900 dark:text-white font-mono">{filteredEntries.length}</strong> of{' '}
          <strong className="text-zinc-900 dark:text-white font-mono">{entries.length}</strong> competitors
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 uppercase text-[0.65rem] tracking-wider">
            <tr>
              <th className="px-4 py-3.5 text-center w-16">Rank</th>
              <th className="px-4 py-3.5">Competitor</th>
              <th className="px-4 py-3.5 text-center">Problems Solved</th>
              <th className="px-4 py-3.5 text-center">Total Score</th>
              <th className="px-4 py-3.5 text-center">Penalty Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {filteredEntries.map((entry) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                isCurrentUser={entry.userId === currentUserId}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Sticky User Row Pinned at Bottom */}
      {currentUserRow && (
        <StickyUserRow
          userRow={currentUserRow}
          deltaPointsToPass={deltaPointsToPass}
        />
      )}
    </div>
  );
};
