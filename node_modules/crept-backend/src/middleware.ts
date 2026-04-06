import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export type AuthUser = { id: number; role: 'admin' | 'user'; email: string; username: string };

declare global {
  namespace Express {
    interface Request { user?: AuthUser }
  }
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev') as AuthUser;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token', code: 'AUTH_INVALID' });
  }
}

export function adminRequired(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden', code: 'ADMIN_ONLY' });
  return next();
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  return res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_ERROR' });
}
