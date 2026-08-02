import { io, Socket } from 'socket.io-client';
import { WS_BASE_URL } from './constants';

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

  public subscribeToSubmission(submissionId: string, onProgress: (data: any) => void) {
    const socket = this.connect();
    socket.emit('subscribe', `submission:${submissionId}`);
    socket.on(`submission:${submissionId}:progress`, onProgress);
  }

  public subscribeToLeaderboard(contestId: string, onUpdate: (data: any) => void) {
    const socket = this.connect();
    socket.emit('subscribe', `contest:${contestId}:leaderboard`);
    socket.on(`contest:${contestId}:leaderboard:update`, onUpdate);
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
