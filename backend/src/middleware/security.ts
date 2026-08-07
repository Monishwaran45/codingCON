import { Request, Response, NextFunction } from 'express';

// Simple sliding-window in-memory fallback rate limiter
interface RateLimitRecord {
  timestamps: number[];
}

const memoryRateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Custom Rate Limiter middleware supporting Redis or In-Memory fallback.
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  const { windowMs, max, message = 'Too many requests, please try again later.' } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip}_${req.baseUrl}${req.path}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = memoryRateLimitStore.get(key);
    if (!record) {
      record = { timestamps: [] };
      memoryRateLimitStore.set(key, record);
    }

    // Clean up timestamps outside current window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= max) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      res.status(429).json({ error: message, code: 'RATE_LIMIT_EXCEEDED' });
      return;
    }

    record.timestamps.push(now);
    next();
  };
}

/**
 * Audit Logging Middleware
 */
export function auditLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[AUDIT] ${new Date().toISOString()} | ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | IP: ${req.ip} | ${duration}ms`);
    }
  });
  next();
}
