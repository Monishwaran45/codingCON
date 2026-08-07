/**
 * Global Jest setup — runs before every test file.
 * Pins all judge-related env vars so tests are deterministic
 * and never accidentally spin up Docker.
 */
process.env.JUDGE_USE_DOCKER  = 'false';
process.env.JUDGE_TIMEOUT_MS  = '10000';
process.env.JUDGE_MEMORY_MB   = '256';
process.env.JWT_SECRET        = 'test-secret';
process.env.NODE_ENV          = 'test';
