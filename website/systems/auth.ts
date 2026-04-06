import jwt from 'jsonwebtoken';

export type SessionUser = { id: number; role: 'admin' | 'user'; email: string; username: string };

export function generateAccessToken(user: SessionUser) {
  return jwt.sign(user, process.env.JWT_SECRET || 'dev', { expiresIn: '1d' });
}

export function generateRefreshToken(user: SessionUser) {
  return jwt.sign(user, process.env.JWT_REFRESH_SECRET || 'refresh', { expiresIn: '30d' });
}

export function verifyAccessToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev') as SessionUser;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh') as SessionUser;
  } catch {
    return null;
  }
}
