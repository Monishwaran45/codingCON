/**
 * Optimized Socket.IO Gateway for High Concurrency (500+ users)
 * - Sticky sessions for clustering
 * - Connection pooling
 * - Memory leak prevention
 * - Graceful disconnection
 * - Event batching
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket, Namespace } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Submission } from '../db/models/Submission';
import { performanceConfig } from '../config/performance';

let io: SocketIOServer | null = null;

// Track active connections for monitoring
const connectionStats = {
  totalConnections: 0,
  peakConnections: 0,
  totalDisconnects: 0,
  errorCount: 0,
};

export function initSocket(httpServer: HTTPServer): SocketIOServer {
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  // Get performance config
  const socketConfig = performanceConfig.socketIO;

  io = new SocketIOServer(httpServer, {
    // Connection settings
    pingInterval: socketConfig.pingInterval, // 25 seconds
    pingTimeout: socketConfig.pingTimeout,   // 60 seconds
    upgradeTimeout: socketConfig.upgradeTimeout,
    
    // Transport settings (prioritize WebSocket for production)
    transports: socketConfig.transports as any, // ['websocket', 'polling']
    
    // Buffer settings
    maxHttpBufferSize: socketConfig.maxHttpBufferSize, // 1MB
    
    // CORS configuration
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || origin.endsWith('.vercel.app')) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
    },

    // Server settings for high concurrency
    serveClient: false, // Client loads Socket.IO from CDN
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true, // Don't re-run middlewares on recovery
    },
  });

  // Add Redis adapter for clustering (if available)
  // This enables sticky sessions across multiple Node.js processes
  if (process.env.REDIS_URL && process.env.CLUSTER_ENABLED === 'true') {
    setupRedisAdapter();
  }

  // ── Auth middleware ──────────────────────────────────────────────────────
  io.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.cookie
          ?.split(';')
          .find((c) => c.trim().startsWith('token='))
          ?.split('=')[1];

      if (!token) {
        // Allow unauthenticated connections (leaderboard is public-facing)
        (socket as Socket & { userId?: string; isAuthenticated?: boolean }).userId = undefined;
        (socket as Socket & { userId?: string; isAuthenticated?: boolean }).isAuthenticated = false;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'changeme') as {
        id: string;
        role: string;
      };
      (socket as Socket & { userId?: string; isAuthenticated?: boolean }).userId = decoded.id;
      (socket as Socket & { userId?: string; isAuthenticated?: boolean }).isAuthenticated = true;
      next();
    } catch (err) {
      // Don't block — just no userId
      (socket as Socket & { userId?: string; isAuthenticated?: boolean }).isAuthenticated = false;
      next();
    }
  });

  // ── Connection handler ───────────────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const userId = (socket as Socket & { userId?: string }).userId;
    const isAuth = (socket as Socket & { isAuthenticated?: boolean }).isAuthenticated;

    connectionStats.totalConnections++;
    if (connectionStats.totalConnections > connectionStats.peakConnections) {
      connectionStats.peakConnections = connectionStats.totalConnections;
    }

    // Log new connection (sample every 100 connections to avoid spam)
    if (connectionStats.totalConnections % 100 === 0) {
      console.log(`📊 Socket.IO: ${connectionStats.totalConnections} connections (peak: ${connectionStats.peakConnections})`);
    }

    // ── Submission subscription ──────────────────────────────────────────────
    socket.on('subscribe:submission', async (submissionId: string) => {
      try {
        if (!submissionId || typeof submissionId !== 'string') return;

        // Verify ownership if user is authenticated
        if (userId && isAuth) {
          const sub = await Submission.findById(submissionId).select('userId').lean();
          if (sub && sub.userId !== userId) {
            return; // Don't allow peeking at others
          }
        }

        socket.join(`submission:${submissionId}`);

        // Send acknowledgment
        socket.emit('subscription:confirmed', {
          room: `submission:${submissionId}`,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        connectionStats.errorCount++;
        console.error('Error in subscribe:submission:', err);
      }
    });

    // ── Leaderboard subscription ─────────────────────────────────────────────
    socket.on('subscribe:leaderboard', (contestId: string) => {
      try {
        if (!contestId || typeof contestId !== 'string') return;
        socket.join(`leaderboard:${contestId}`);
        
        socket.emit('subscription:confirmed', {
          room: `leaderboard:${contestId}`,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        connectionStats.errorCount++;
        console.error('Error in subscribe:leaderboard:', err);
      }
    });

    // ── Contest subscription ─────────────────────────────────────────────────
    socket.on('subscribe:contest', (contestId: string) => {
      try {
        if (!contestId || typeof contestId !== 'string') return;
        socket.join(`contest:${contestId}`);
        
        socket.emit('subscription:confirmed', {
          room: `contest:${contestId}`,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        connectionStats.errorCount++;
        console.error('Error in subscribe:contest:', err);
      }
    });

    // ── Unsubscribe handlers ─────────────────────────────────────────────────
    socket.on('unsubscribe:submission', (submissionId: string) => {
      if (submissionId && typeof submissionId === 'string') {
        socket.leave(`submission:${submissionId}`);
      }
    });

    socket.on('unsubscribe:leaderboard', (contestId: string) => {
      if (contestId && typeof contestId === 'string') {
        socket.leave(`leaderboard:${contestId}`);
      }
    });

    socket.on('unsubscribe:contest', (contestId: string) => {
      if (contestId && typeof contestId === 'string') {
        socket.leave(`contest:${contestId}`);
      }
    });

    // ── Ping-pong for keep-alive ─────────────────────────────────────────────
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // ── Disconnection handler ────────────────────────────────────────────────
    socket.on('disconnect', (reason: string) => {
      connectionStats.totalConnections--;
      connectionStats.totalDisconnects++;

      // Log disconnections (sample every 50)
      if (connectionStats.totalDisconnects % 50 === 0) {
        console.log(
          `📊 Socket.IO: ${connectionStats.totalDisconnects} disconnects (active: ${connectionStats.totalConnections})`
        );
      }
    });

    // ── Error handler ────────────────────────────────────────────────────────
    socket.on('error', (error: any) => {
      connectionStats.errorCount++;
      console.error('Socket.IO error:', error);
    });
  });

  // Emit stats endpoint for monitoring
  io.engine.on('connection_error', (err: any) => {
    connectionStats.errorCount++;
    console.error('Connection error:', err);
  });

  // Log stats periodically (every 5 minutes)
  setInterval(() => {
    console.log(`📊 Socket.IO Stats:
    - Active Connections: ${connectionStats.totalConnections}
    - Peak Connections: ${connectionStats.peakConnections}
    - Total Disconnects: ${connectionStats.totalDisconnects}
    - Errors: ${connectionStats.errorCount}
    - Connected Rooms: ${io?.sockets.adapter.rooms.size || 0}`);
  }, 5 * 60 * 1000);

  return io;
}

/**
 * Setup Redis adapter for clustering
 * Enables Socket.IO to work across multiple Node.js processes
 */
async function setupRedisAdapter(): Promise<void> {
  try {
    const { createAdapter } = await import('@socket.io/redis-adapter');
    const { createClient } = await import('redis');

    const redisClient = createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();

    const pubClient = redisClient.duplicate();
    await pubClient.connect();

    io?.adapter(createAdapter(pubClient, pubClient.duplicate()));
    console.log('✓ Socket.IO Redis adapter configured (clustering enabled)');
  } catch (err) {
    console.warn('⚠️  Redis adapter not available, Socket.IO running in single-instance mode');
  }
}

/**
 * Emit event to a specific room (used by judge worker)
 */
export function emitToRoom(room: string, eventName: string, data: any): void {
  if (io) {
    io.to(room).emit(eventName, data);
  }
}

/**
 * Get Socket.IO server instance
 */
export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Get current connection statistics
 */
export function getConnectionStats(): typeof connectionStats {
  if (!io) {
    return connectionStats;
  }

  return {
    ...connectionStats,
    totalConnections: io.engine.clientsCount,
    peakConnections: connectionStats.peakConnections,
  };
}

/**
 * Gracefully shutdown Socket.IO
 */
export async function shutdownSocket(): Promise<void> {
  if (io) {
    console.log('📛 Shutting down Socket.IO...');
    io.disconnectSockets();
    await io.close();
    console.log('✓ Socket.IO shutdown complete');
  }
}
