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

  const currentUserRow = entries.find((e) => e.userId === currentUserId) || entries[2];

  const filteredEntries = entries
    .filter((e) => e.username.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 50); // Cap visible full ranking at top 50 per spec

  return (
    <div className="space-y-4 pb-20 font-jetbrains">
      {/* Freeze Banner if frozen */}
      {isFrozen && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-center text-xs text-amber-300 font-bold">
          ❄️ LEADERBOARD FROZEN UNTIL CONTEST ENDS — Scores are hidden to build suspense!
        </div>
      )}

      {/* Toolbar Search */}
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by participant handle..."
          className="w-full max-w-xs rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
        />
        <div className="text-xs text-slate-400">
          Showing top <strong className="text-slate-200">{filteredEntries.length}</strong> competitors
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase text-[0.68rem] tracking-wider">
            <tr>
              <th className="px-4 py-3 text-center">Rank</th>
              <th className="px-4 py-3">Participant</th>
              <th className="px-4 py-3 text-center">Solved</th>
              <th className="px-4 py-3 text-center">Score</th>
              <th className="px-4 py-3 text-center">Penalty</th>
            </tr>
          </thead>
          <tbody>
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
          deltaPointsToPass={170}
        />
      )}
    </div>
  );
};
