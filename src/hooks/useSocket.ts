import { useEffect } from 'react';
import { socketService, SubmissionProgressEvent } from '@/lib/socket';
import { LeaderboardEntry } from '@/types';

/**
 * Hook to subscribe to real-time submission progress via Socket.IO.
 *
 * NOTE: The primary subscription now happens inside `useVerdictStore.submitCode()`
 * to avoid the race condition where the judge finishes before React re-renders.
 * This hook acts as a **secondary safety net** — if the submissionId is set
 * (e.g. after a page refresh while a submission is still running), it ensures
 * we re-subscribe.
 */
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

    // Re-subscribe as a safety net (idempotent on the server side)
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
