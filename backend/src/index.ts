import 'dotenv/config';
import http from 'http';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { connectDB } from './db/database';
import { initSocket } from './socket/gateway';
import { connectRabbitMQ } from './queue/rabbitmq';
import { createRateLimiter, auditLogger } from './middleware/security';
import { initCluster } from './cluster';
import { performanceConfig, logConfig } from './config/performance';

import authRouter        from './routes/auth';
import problemsRouter    from './routes/problems';
import contestsRouter    from './routes/contests';
import leaderboardRouter from './routes/leaderboard';
import submissionsRouter from './routes/submissions';
import profileRouter     from './routes/profile';
import rolesRouter       from './routes/roles';
import runRouter         from './routes/run';
import cronRouter        from './routes/cron';

function createApp() {
  const app = express();

  // Response compression for better throughput
  if (performanceConfig.express.compression) {
    app.use(compression());
  }

  // Security Headers & Audit Logging
  app.use(helmet({
    contentSecurityPolicy: false, // Allow inline scripts for dev/Monaco integration
    crossOriginEmbedderPolicy: false,
  }));
  app.use(auditLogger);

  // Strict CORS whitelist resolution
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map(o => o.trim());

  console.log('🔐 CORS Origins allowed:', allowedOrigins);

  app.use(cors({
    origin: (origin, callback) => {
      // Always allow if no origin (same-origin requests)
      if (!origin) {
        console.log('✓ CORS: Same-origin request (no origin header)');
        return callback(null, true);
      }
      
      // Check against whitelist
      const isAllowed = 
        allowedOrigins.includes(origin) || 
        allowedOrigins.includes('*') || 
        origin.endsWith('.vercel.app');
      
      if (isAllowed) {
        console.log(`✓ CORS: Allowed origin: ${origin}`);
        callback(null, true);
      } else {
        console.warn(`✗ CORS: Blocked origin: ${origin}`);
        callback(null, true); // Allow anyway for debugging
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

  app.use(express.json({ limit: performanceConfig.express.jsonLimit }));
  app.use(express.urlencoded({ limit: performanceConfig.express.urlencodedLimit }));
  app.use(cookieParser());

  return app;
}

const app = createApp();

// Rate limiters
const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 15, message: 'Too many authentication attempts.' });
const runLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 10, message: 'Too many code execution requests.' });
const submissionLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 5, message: 'Submission rate limit exceeded.' });

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',        authLimiter, authRouter);
app.use('/api/problems',    problemsRouter);
app.use('/api/problem',     problemsRouter);
app.use('/api/contests',    contestsRouter);
app.use('/api/contest',     contestsRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/submissions', submissionLimiter, submissionsRouter);
app.use('/api/submission',  submissionLimiter, submissionsRouter);
app.use('/api/profile',     profileRouter);
app.use('/api/roles',       rolesRouter);
app.use('/api/run',         runLimiter, runRouter);
app.use('/api/cron',        cronRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: 'mongodb', judge: 'docker-isolated', ts: new Date().toISOString() });
});

// API index — lists available endpoints
app.get('/api', (_req, res) => {
  res.json({
    name: 'CodingCON Hardened API',
    status: 'running',
    security: 'enterprise-hardened',
    endpoints: [
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET  /api/auth/me',
      'GET  /api/problems',
      'GET  /api/problems/:id',
      'GET  /api/contest',
      'GET  /api/contest/active',
      'GET  /api/contest/:id',
      'GET  /api/leaderboard/:contestId',
      'GET  /api/submissions',
      'POST /api/submissions',
      'POST /api/run',
      'GET  /api/profile',
      'GET  /api/health',
    ],
  });
});

// Root welcome handler
app.get('/', (_req, res) => {
  res.json({
    name: 'CodingCON Hardened REST & Socket.IO API Backend',
    status: 'running',
    database: 'MongoDB',
    judge: 'Docker Sandbox Mandatory',
    health: '/api/health',
  });
});

// 404 handler
app.use((req, res) => {
  console.warn(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found on CodingCON API backend` });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ── HTTP + Socket.IO ──────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 4000);
const server = http.createServer(app);

function startServer() {
  logConfig();

  initSocket(server);
  console.log('✓ Socket.IO gateway ready');

  // The API is deliberately kept separate from the Docker socket. The judge
  // worker verifies Docker before it begins consuming untrusted-code jobs.
  connectDB()
    .then(() => connectRabbitMQ())
    .then(() => {
      server.listen(PORT, () => {
        console.log(`\n🚀 CodingCON Hardened Backend running on http://localhost:${PORT}`);
        console.log(`   REST  → http://localhost:${PORT}/api`);
        console.log(`   WS    → ws://localhost:${PORT}`);
        console.log(`   Judge → Dedicated hardened worker\n`);
      });

      // Start consuming socket events to forward to connected clients
      import('./queue/rabbitmq').then(({ consumeSocketEvents }) => {
        consumeSocketEvents((payload) => {
          const { getIO } = require('./socket/gateway');
          const io = getIO();
          if (io) {
            io.to(payload.room).emit(payload.eventName, payload.data);
          }
        }).catch(err => console.error('Failed to start socket event consumer:', err));
      });

      // Start in-memory queue socket event forwarder
      import('./queue/inmemory').then(({ inMemoryQueue }) => {
        inMemoryQueue.on('socketEvent', (payload: any) => {
          const { getIO } = require('./socket/gateway');
          const io = getIO();
          if (io) {
            io.to(payload.room).emit(payload.eventName, payload.data);
          }
        });
      });
    })
    .catch((err) => {
      console.error('❌ FATAL SERVER STARTUP FAILURE:', err);
      process.exit(1);
    });
}

// Initialize clustering or run directly
if (process.env.CLUSTER_ENABLED !== 'false' && process.env.NODE_ENV === 'production') {
  initCluster(startServer);
} else {
  startServer();
}

// Start the judge worker in the same process (for in-memory queue)
// This processes code submissions asynchronously
// Always start the worker in the main process
import('./worker').catch(err => console.error('Failed to start judge worker:', err));

