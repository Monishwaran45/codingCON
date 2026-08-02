import { useEffect } from 'react';
import { socketService } from '@/lib/socket';
import { LeaderboardEntry } from '@/types';

export function useSubmissionSocket(
  submissionId: string | null,
  onProgress: (data: any) => void
) {
  useEffect(() => {
    if (!submissionId) return;

    const socket = socketService.connect();
    if (!socket.connected) {
      socket.connect();
    }

    socketService.subscribeToSubmission(submissionId, onProgress);

    return () => {
      // Cleanup listener on unmount or submission complete
      socket.off(`submission:${submissionId}:progress`, onProgress);
    };
  }, [submissionId, onProgress]);
}

export function useLeaderboardSocket(
  contestId: string,
  onLeaderboardUpdate: (data: LeaderboardEntry[]) => void
) {
  useEffect(() => {
    if (!contestId) return;

    const socket = socketService.connect();
    if (!socket.connected) {
      socket.connect();
    }

    socketService.subscribeToLeaderboard(contestId, onLeaderboardUpdate);

    return () => {
      socket.off(`contest:${contestId}:leaderboard:update`, onLeaderboardUpdate);
    };
  }, [contestId, onLeaderboardUpdate]);
}
