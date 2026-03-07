import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  discordId?: string;
  githubId?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      discordId?: string;
      githubId?: string;
    };
    req.userId    = payload.userId;
    req.discordId = payload.discordId;
    req.githubId  = payload.githubId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}