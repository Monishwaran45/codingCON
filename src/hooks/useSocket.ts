import { useEffect } from 'react';
import { socketService, SubmissionProgressEvent } from '@/lib/socket';
import { LeaderboardEntry } from '@/types';

export function useSubmissionSocket(
  submissionId: string | null,
  onProgress: (data: SubmissionProgressEvent) => void
) {
  useEffect(() => {
    if (!submissionId) return;

    const socket = socketService.connect();
    if (!socket.connected) {
      socket.connect();
    }

    socketService.subscribeToSubmission(submissionId, onProgress);

    return () => {
      socketService.unsubscribeFromSubmission(submissionId, onProgress);
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
      socketService.unsubscribeFromLeaderboard(contestId, onLeaderboardUpdate);
    };
  }, [contestId, onLeaderboardUpdate]);
}
