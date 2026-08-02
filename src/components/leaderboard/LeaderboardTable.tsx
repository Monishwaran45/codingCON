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
  const [scrollTop, setScrollTop] = useState(0);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const ROW_HEIGHT = 48; // Fixed height per table row in pixels
  const VIEWPORT_HEIGHT = 500; // Fixed scroll viewport height
  const OVERSCAN = 5;

  const userIndex = entries.findIndex((e) => e.userId === currentUserId);
  const currentUserRow = userIndex !== -1 ? entries[userIndex] : null;
  const nextRankRow = userIndex > 0 ? entries[userIndex - 1] : null;
  const deltaPointsToPass = (currentUserRow && nextRankRow) ? (nextRankRow.totalScore - currentUserRow.totalScore) : 0;

  const filteredEntries = entries.filter((e) =>
    e.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Virtual Windowing Math
  const totalRows = filteredEntries.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(totalRows, Math.ceil((scrollTop + VIEWPORT_HEIGHT) / ROW_HEIGHT) + OVERSCAN);
  const visibleEntries = filteredEntries.slice(startIndex, endIndex);

  const paddingTop = startIndex * ROW_HEIGHT;
  const paddingBottom = Math.max(0, (totalRows - endIndex) * ROW_HEIGHT);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

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
          className="w-full max-w-xs rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
        />
        <div className="text-xs text-zinc-400">
          Showing <strong className="text-white">{filteredEntries.length}</strong> / 500+ competitors (60fps virtualized)
        </div>
      </div>

      {/* Virtualized Table Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{ height: `${VIEWPORT_HEIGHT}px` }}
        className="overflow-y-auto rounded-xl border border-zinc-900 bg-zinc-950/60"
      >
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 z-20 border-b border-zinc-900 bg-black text-zinc-400 uppercase text-[0.68rem] tracking-wider">
            <tr>
              <th className="px-4 py-3 text-center">Rank</th>
              <th className="px-4 py-3">Participant</th>
              <th className="px-4 py-3 text-center">Solved</th>
              <th className="px-4 py-3 text-center">Score</th>
              <th className="px-4 py-3 text-center">Penalty</th>
            </tr>
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr>
                <td colSpan={5} style={{ height: `${paddingTop}px` }} />
              </tr>
            )}
            {visibleEntries.map((entry) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                isCurrentUser={entry.userId === currentUserId}
              />
            ))}
            {paddingBottom > 0 && (
              <tr>
                <td colSpan={5} style={{ height: `${paddingBottom}px` }} />
              </tr>
            )}
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
