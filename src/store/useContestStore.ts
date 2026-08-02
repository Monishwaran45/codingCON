import { create } from 'zustand';
import { Contest, LeaderboardEntry } from '@/types';

interface ContestState {
  contest: Contest | null;
  leaderboard: LeaderboardEntry[];
  timeRemainingSeconds: number;
  userRank: number;
  userDeltaScore: number;
  isLeaderboardFrozen: boolean;
  announcements: { id: string; timestamp: string; message: string }[];
  updateTimer: () => void;
  filterLeaderboard: (query: string) => LeaderboardEntry[];
  setContest: (contest: Contest) => void;
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
  setUserRankDetails: (rank: number, delta: number) => void;
}

export const useContestStore = create<ContestState>((set, get) => ({
  contest: null,
  leaderboard: [],
  timeRemainingSeconds: 0,
  userRank: 0,
  userDeltaScore: 0,
  isLeaderboardFrozen: false,
  announcements: [],
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
  setContest: (contest: Contest) => {
    const seconds = Math.max(0, Math.floor((new Date(contest.endTime).getTime() - Date.now()) / 1000));
    set({
      contest,
      timeRemainingSeconds: seconds,
      isLeaderboardFrozen: !!contest.isLeaderboardFrozen,
      announcements: contest.announcements,
    });
  },
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => {
    set({ leaderboard });
  },
  setUserRankDetails: (rank: number, delta: number) => {
    set({ userRank: rank, userDeltaScore: delta });
  },
}));
