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

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export function signToken(payload: { id: string; email: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
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
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string; email: string; role: string;
    };

    // Verify user still exists in DB
    const userDoc = await User.findById(decoded.id).select('id email username role');

    if (!userDoc) {
      res.status(401).json({ error: 'User not found' });
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
