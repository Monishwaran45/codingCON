import 'dotenv/config';
import http from 'http';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import { connectDB } from './db/database';
import { initSocket } from './socket/gateway';
import { connectRabbitMQ } from './queue/rabbitmq';

import authRouter        from './routes/auth';
import problemsRouter    from './routes/problems';
import contestsRouter    from './routes/contests';
import leaderboardRouter from './routes/leaderboard';
import submissionsRouter from './routes/submissions';
import profileRouter     from './routes/profile';
import rolesRouter       from './routes/roles';
import runRouter         from './routes/run';

const app = express();

app.use(cors({
  origin:      process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRouter);
app.use('/api/problems',    problemsRouter);
app.use('/api/problem',     problemsRouter);
app.use('/api/contests',    contestsRouter);
app.use('/api/contest',     contestsRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/submission',  submissionsRouter);
app.use('/api/profile',     profileRouter);
app.use('/api/roles',       rolesRouter);
app.use('/api/run',         runRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: 'mongodb', ts: new Date().toISOString() });
});

// API index — lists available endpoints
app.get('/api', (_req, res) => {
  res.json({
    name: 'CodingCON API',
    status: 'running',
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
    name: 'CodingCON REST & Socket.IO API Backend',
    status: 'running',
    database: 'MongoDB',
    health: '/api/health',
    frontend: 'http://localhost:3000',
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
  res.status(500).json({ error: 'Internal server error' });
});

// ── HTTP + Socket.IO ──────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 4000);
const server = http.createServer(app);

initSocket(server);
console.log('✓ Socket.IO gateway ready');

// Connect DB and MQ first then start server
connectDB()
  .then(() => connectRabbitMQ())
  .then(() => {
    server.listen(PORT, () => {
      console.log(`\n🚀  CodingCON backend running on http://localhost:${PORT}`);
      console.log(`   REST  → http://localhost:${PORT}/api`);
      console.log(`   WS    → ws://localhost:${PORT}`);
      console.log(`   Env   → ${process.env.NODE_ENV}`);
      console.log(`   DB    → MongoDB`);
      console.log(`   Judge → ${process.env.JUDGE_USE_DOCKER === 'true' ? 'Docker' : 'Native (no Docker)'}\n`);
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
  })
  .catch((err) => {
    console.error('Fatal: Failed to connect to MongoDB', err);
    process.exit(1);
  });
