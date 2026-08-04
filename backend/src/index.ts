import 'dotenv/config';
import http from 'http';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import { initSchema } from './db/database';
import { initSocket } from './socket/gateway';

import authRouter        from './routes/auth';
import problemsRouter    from './routes/problems';
import contestsRouter    from './routes/contests';
import leaderboardRouter from './routes/leaderboard';
import submissionsRouter from './routes/submissions';
import profileRouter     from './routes/profile';

// ── Bootstrap DB ─────────────────────────────────────────────────────────────
initSchema();
console.log('✓ DB schema ready');

// ── Express app ───────────────────────────────────────────────────────────────
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
app.use('/api/contest',     contestsRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/profile',     profileRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
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

server.listen(PORT, () => {
  console.log(`\n🚀  CodingCON backend running on http://localhost:${PORT}`);
  console.log(`   REST  → http://localhost:${PORT}/api`);
  console.log(`   WS    → ws://localhost:${PORT}`);
  console.log(`   Env   → ${process.env.NODE_ENV}`);
  console.log(`   Judge → ${process.env.JUDGE_USE_DOCKER === 'true' ? 'Docker' : 'Native (no Docker)'}\n`);
});
