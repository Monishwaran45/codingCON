import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../db/models/User';
import { Role } from '../db/models/Role';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    role: string;
    permissions: string[];
  };
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '' || secret === 'changeme') {
    if (process.env.NODE_ENV === 'test') {
      return 'test-secret-key-1234567890-must-be-long-enough';
    }
    console.error('❌ FATAL: JWT_SECRET environment variable is missing or insecure default ("changeme").');
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable must be explicitly defined and secure.');
  }
  return secret;
}

const JWT_SECRET = getJwtSecret();
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || `${JWT_SECRET}_refresh`;

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  maxAge?: number;
}

export const SECURE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export function signToken(payload: { id: string; email: string; role: string }): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: { id: string }): string {
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || `${getJwtSecret()}_refresh`;
  return jwt.sign(payload, refreshSecret, {
    expiresIn: '7d',
  } as jwt.SignOptions);
}

export function verifyRefreshToken(token: string): { id: string } {
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || `${getJwtSecret()}_refresh`;
  return jwt.verify(token, refreshSecret) as { id: string };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  // Accept from cookie OR Authorization header
  const token =
    req.cookies?.token ||
    req.headers.authorization?.replace(/^Bearer\s+/, '');

  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as {
      id: string; email: string; role: string;
    };

    // Verify user still exists in DB
    const userDoc = await User.findById(decoded.id).select('id email username role');

    if (!userDoc) {
      // User was deleted or DB was wiped — clear the stale cookie
      res.clearCookie('token', SECURE_COOKIE_OPTIONS);
      res.status(401).json({ error: 'Session expired, please log in again' });
      return;
    }

    const roleDoc = await Role.findOne({ name: userDoc.role });

    req.user = {
      id: userDoc._id,
      email: userDoc.email,
      username: userDoc.username,
      role: userDoc.role,
      permissions: roleDoc?.permissions || [],
    };
    next();
  } catch {
    res.clearCookie('token', SECURE_COOKIE_OPTIONS);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requirePermission(...permissions: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !permissions.some(p => req.user!.permissions.includes(p))) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
