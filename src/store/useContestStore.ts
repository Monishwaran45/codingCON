import { create } from 'zustand';
import { Contest, LeaderboardEntry } from '@/types';
import { MOCK_CONTEST, MOCK_LEADERBOARD } from '@/mocks/leaderboard';

interface ContestState {
  contest: Contest | null;
  leaderboard: LeaderboardEntry[];
  timeRemainingSeconds: number;
  userRank: number;
  userDeltaScore: number; // "+2 pts to pass rank above"
  isLeaderboardFrozen: boolean;
  announcements: { id: string; timestamp: string; message: string }[];
  updateTimer: () => void;
  filterLeaderboard: (query: string) => LeaderboardEntry[];
}

export const useContestStore = create<ContestState>((set, get) => ({
  contest: MOCK_CONTEST,
  leaderboard: MOCK_LEADERBOARD,
  timeRemainingSeconds: 5400, // 90 minutes
  userRank: 3,
  userDeltaScore: 170, // 2420 - 2250 = 170 pts to pass Benq
  isLeaderboardFrozen: false,
  announcements: MOCK_CONTEST.announcements,
  updateTimer: () => {
    set((state) => ({
      timeRemainingSeconds: Math.max(0, state.timeRemainingSeconds - 1),
    }));
  },
  filterLeaderboard: (query: string) => {
    const list = get().leaderboard;
    if (!query) return list;
    return list.filter((row) =>
      row.username.toLowerCase().includes(query.toLowerCase())
    );
  },
}));
