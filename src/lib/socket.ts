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
  isStreaming?: boolean;
  testCaseResult?: {
    id: string;
    passed: boolean;
    executionTimeMs?: number;
    memoryKb?: number;
    expectedOutput?: string;
    actualOutput?: string;
    error?: string;
  };
  failedTestCase?: {
    id: string;
    passed: boolean;
    expectedOutput: string;
    actualOutput: string;
    executionTimeMs: number;
    memoryKb: number;
    error?: string;
  };
}

class SocketService {
  private socket: Socket | null = null;

  public connect(): Socket {
    if (!this.socket) {
      this.socket = io(WS_BASE_URL, {
        autoConnect: false,
        withCredentials: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'],
        path: '/socket.io/',
      });
    }
    return this.socket;
  }

  public subscribeToSubmission(
    submissionId: string,
    onProgress: (data: SubmissionProgressEvent) => void,
  ) {
    const socket = this.connect();
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('subscribe:submission', submissionId);
    socket.on('submission:progress', onProgress);
    socket.on('submission:done', onProgress);
  }

  public unsubscribeFromSubmission(
    submissionId: string,
    onProgress: (data: SubmissionProgressEvent) => void,
  ) {
    if (this.socket) {
      this.socket.off('submission:progress', onProgress);
      this.socket.off('submission:done', onProgress);
    }
  }

  public subscribeToLeaderboard(
    contestId: string,
    onUpdate: (data: LeaderboardEntry[]) => void,
  ) {
    const socket = this.connect();
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('subscribe:leaderboard', contestId);
    socket.on('leaderboard:update', onUpdate);
  }

  public unsubscribeFromLeaderboard(
    contestId: string,
    onUpdate: (data: LeaderboardEntry[]) => void,
  ) {
    if (this.socket) {
      this.socket.off('leaderboard:update', onUpdate);
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
