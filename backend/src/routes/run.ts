/**
 * POST /api/run
 *
 * Runs user code against custom stdin safely using bounded async execution queues.
 * Used by the "Custom Input" panel in the frontend editor.
 *
 * Body: { problemId, language, code, stdin }
 * Returns: { stdout, stderr, executionTimeMs, exitCode, timedOut }
 */

import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { runCode, RunResult } from '../judge/runner';

const router = Router();

const SUPPORTED_LANGUAGES = ['python', 'javascript', 'cpp', 'java'];
const MAX_CONCURRENT_RUNS = Number(process.env.MAX_CONCURRENT_RUNS ?? 25);
let activeRunCount = 0;
const runQueue: Array<() => void> = [];

async function acquireRunSlot(timeoutMs = 8000): Promise<void> {
  if (activeRunCount < MAX_CONCURRENT_RUNS) {
    activeRunCount++;
    return;
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const idx = runQueue.indexOf(cb);
      if (idx !== -1) {
        runQueue.splice(idx, 1);
        reject(new Error('Server busy: Execution queue wait timed out. Please retry.'));
      }
    }, timeoutMs);

    const cb = () => {
      clearTimeout(timer);
      activeRunCount++;
      resolve();
    };

    runQueue.push(cb);
  });
}

function releaseRunSlot(): void {
  activeRunCount--;
  const next = runQueue.shift();
  if (next) {
    next();
  }
}

router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { language, code, stdin = '' } = req.body as {
      language: string;
      code: string;
      stdin?: string;
    };

    if (!language || !code) {
      res.status(400).json({ error: 'language and code are required' });
      return;
    }

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      res.status(400).json({ error: `Unsupported language: ${language}` });
      return;
    }

    if (code.length > 64_000) {
      res.status(413).json({ error: 'Code exceeds maximum allowed size (64 KB)' });
      return;
    }

    // Acquire execution slot from queue controller
    await acquireRunSlot();
    let result: RunResult;

    try {
      result = await runCode(language, code, stdin);
    } finally {
      releaseRunSlot();
    }

    res.json({
      stdout:          result.stdout,
      stderr:          result.stderr,
      executionTimeMs: result.executionTimeMs,
      exitCode:        result.exitCode,
      timedOut:        result.timedOut,
    });
  } catch (err) {
    console.error('[run] Error:', err);
    res.status(500).json({ error: 'Failed to execute code' });
  }
});

export default router;

