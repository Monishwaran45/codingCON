/**
 * POST /api/run
 *
 * Runs user code against custom stdin immediately (no queue, no DB write).
 * Used exclusively by the "Custom Input" panel in the frontend editor.
 *
 * Body: { problemId, language, code, stdin }
 * Returns: { stdout, stderr, executionTimeMs, exitCode, timedOut }
 */

import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { runCode } from '../judge/runner';

const router = Router();

const SUPPORTED_LANGUAGES = ['python', 'javascript', 'cpp', 'java'];

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

    const result = await runCode(language, code, stdin);

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
