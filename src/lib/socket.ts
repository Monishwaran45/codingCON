import { io, Socket } from 'socket.io-client';
import { WS_BASE_URL } from './constants';
import { LeaderboardEntry } from '@/types';

export interface SubmissionProgressEvent {
  submissionId: string;
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs?: number;
  memoryKb?: number;
  verdict?: 'running' | 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE';
}

class SocketService {
  private socket: Socket | null = null;

  public connect(): Socket {
    if (!this.socket) {
      this.socket = io(WS_BASE_URL, {
        autoConnect: false,
        withCredentials: true,
        transports: ['websocket'],
      });
    }
    return this.socket;
  }

  public subscribeToSubmission(submissionId: string, onProgress: (data: SubmissionProgressEvent) => void) {
    const socket = this.connect();
    socket.emit('subscribe', `submission:${submissionId}`);
    socket.on(`submission:${submissionId}:progress`, onProgress);
  }

  public unsubscribeFromSubmission(submissionId: string, onProgress: (data: SubmissionProgressEvent) => void) {
    if (this.socket) {
      this.socket.off(`submission:${submissionId}:progress`, onProgress);
    }
  }

  public subscribeToLeaderboard(contestId: string, onUpdate: (data: LeaderboardEntry[]) => void) {
    const socket = this.connect();
    socket.emit('subscribe', `contest:${contestId}:leaderboard`);
    socket.on(`contest:${contestId}:leaderboard:update`, onUpdate);
  }

  public unsubscribeFromLeaderboard(contestId: string, onUpdate: (data: LeaderboardEntry[]) => void) {
    if (this.socket) {
      this.socket.off(`contest:${contestId}:leaderboard:update`, onUpdate);
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
