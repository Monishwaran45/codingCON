import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/database';
import { UserRow } from '../db/types';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    role: 'student' | 'admin' | 'problem_setter';
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export function signToken(payload: { id: string; email: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  // Accept from cookie OR Authorization header
  const token =
    req.cookies?.token ||
    req.headers.authorization?.replace(/^Bearer\s+/, '');

  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string; email: string; role: string;
    };

    // Verify user still exists in DB
    const raw = db
      .prepare('SELECT id, email, username, role FROM users WHERE id = ?')
      .get(decoded.id);
    const user = raw as Pick<UserRow, 'id' | 'email' | 'username' | 'role'> | undefined;

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
