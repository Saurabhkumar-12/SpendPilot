import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { db } from '../db/database.js';

export function authGuard(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Access denied. Token missing.' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Verify user exists
    if (!decoded.userId || !decoded.sessionId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = db.findOne('users', u => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User account no longer exists.' });
    }

    const session = db.findOne('sessions', s =>
      s.id === decoded.sessionId &&
      s.user_id === user.id &&
      Number(s.is_revoked) === 0 &&
      (!s.expires_at || new Date(s.expires_at) > new Date())
    );
    if (!session) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
      sessionId: decoded.sessionId
    };

    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token. Please log in again.' });
  }
}

export const authenticateToken = authGuard;
