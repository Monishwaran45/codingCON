import { io, Socket } from 'socket.io-client';
import { WS_BASE_URL } from './constants';
import { getAuthToken } from './auth-token';
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
      const token = getAuthToken();

      console.log('[Socket] Connecting to', WS_BASE_URL, token ? '(authenticated)' : '(anonymous)');

      this.socket = io(WS_BASE_URL, {
        autoConnect: false,
        withCredentials: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        transports: ['websocket', 'polling'],
        path: '/socket.io/',
        // Send the JWT so the backend gateway can verify ownership
        auth: token ? { token } : {},
      });

      // Debug logging
      this.socket.on('connect', () => {
        console.log('[Socket] Connected, id:', this.socket?.id);
      });

      this.socket.on('connect_error', (err) => {
        console.error('[Socket] Connection error:', err.message);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
      });
    }
    return this.socket;
  }

  /**
   * Ensure the socket is connected. Resolves immediately if already
   * connected, otherwise waits up to `timeoutMs` for the 'connect' event.
   */
  public waitForConnection(timeoutMs = 3000): Promise<Socket> {
    const socket = this.connect();

    if (socket.connected) return Promise.resolve(socket);

    if (!socket.connected) {
      socket.connect();
    }

    return new Promise<Socket>((resolve, reject) => {
      const timer = setTimeout(() => {
        // Even if not officially "connected", the socket may still work
        // via polling — resolve anyway so we don't block submission flow.
        console.warn('[Socket] Connection timed out after', timeoutMs, 'ms — proceeding anyway');
        resolve(socket);
      }, timeoutMs);

      socket.once('connect', () => {
        clearTimeout(timer);
        resolve(socket);
      });
    });
  }

  public subscribeToSubmission(
    submissionId: string,
    onProgress: (data: SubmissionProgressEvent) => void,
  ) {
    const socket = this.connect();
    if (!socket.connected) {
      socket.connect();
    }
    console.log('[Socket] Subscribing to submission:', submissionId);
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

  /**
   * Force-reconnect with fresh credentials (e.g. after login).
   * Tears down the existing socket so the next `connect()` picks up
   * the new JWT from localStorage.
   */
  public reconnectWithAuth() {
    this.disconnect();
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
