import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { db } from '../config/db';

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      rawToken?: string;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  rawToken?: string;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void | Response {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please sign in.' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: number; email: string; name: string };
    
    // Check if session is active in database (revocation check)
    const tokenHash = hashToken(token);
    const session = db.prepare(`
      SELECT id, is_active, datetime(expires_at) as expires_at, datetime('now') as now
      FROM user_sessions
      WHERE token_hash = ?
    `).get(tokenHash) as { id: number; is_active: number; expires_at: string; now: string } | undefined;

    // If session entry exists, verify it is active and not expired
    if (session) {
      if (!session.is_active || new Date(session.expires_at).getTime() < Date.now()) {
        return res.status(401).json({ error: 'Your session has been terminated or expired. Please sign in again.' });
      }

      // Update last active timestamp
      db.prepare("UPDATE user_sessions SET last_active_at = datetime('now') WHERE id = ?").run(session.id);
    }

    // Verify user exists in database
    const user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(decoded.id) as AuthenticatedUser | undefined;
    
    if (!user) {
      return res.status(401).json({ error: 'User account not found or deactivated.' });
    }

    req.user = user;
    req.rawToken = token;
    return next();
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    }
    return res.status(403).json({ error: 'Invalid authentication token.' });
  }
}


