import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import db from '../db/database';

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HTTPServer): SocketIOServer {
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

  io = new SocketIOServer(httpServer, {
    cors: {
      origin:      corsOrigin,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // ── Auth middleware ──────────────────────────────────────────────────────
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.cookie
        ?.split(';')
        .find((c) => c.trim().startsWith('token='))
        ?.split('=')[1];

    if (!token) {
      // Allow unauthenticated connections (leaderboard is public-facing)
      (socket as Socket & { userId?: string }).userId = undefined;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'changeme') as {
        id: string; role: string;
      };
      (socket as Socket & { userId?: string }).userId = decoded.id;
      next();
    } catch {
      next(); // Don't block — just no userId
    }
  });

  // ── Connection handler ───────────────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const userId = (socket as Socket & { userId?: string }).userId;

    // Client subscribes to their own submission updates
    socket.on('subscribe:submission', (submissionId: string) => {
      if (!submissionId || typeof submissionId !== 'string') return;

      // Verify ownership if user is authenticated
      if (userId) {
        const sub = db
          .prepare('SELECT user_id FROM submissions WHERE id = ?')
          .get(submissionId) as { user_id: string } | undefined;
        if (sub && sub.user_id !== userId) return; // don't allow peeking at others
      }

      socket.join(`submission:${submissionId}`);
    });

    // Client subscribes to contest leaderboard updates
    socket.on('subscribe:leaderboard', (contestId: string) => {
      if (!contestId || typeof contestId !== 'string') return;
      socket.join(`contest:${contestId}`);
    });

    // Client subscribes to contest announcements
    socket.on('subscribe:contest', (contestId: string) => {
      if (!contestId || typeof contestId !== 'string') return;
      socket.join(`contest:${contestId}`);
    });

    socket.on('disconnect', () => {
      // rooms are automatically cleaned up by socket.io
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}
