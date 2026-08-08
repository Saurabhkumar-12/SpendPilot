import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { db } from '../db/database.js';

export function authGuard(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Access denied. Token missing.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Verify user exists
    const user = db.findOne('users', u => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User account no longer exists.' });
    }

    // Verify active non-revoked session if sessionId is attached
    if (decoded.sessionId) {
      const session = db.findOne('sessions', s => s.id === decoded.sessionId && s.is_revoked === 0);
      if (!session) {
        return res.status(401).json({ success: false, error: 'Session has been revoked or expired.' });
      }
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
