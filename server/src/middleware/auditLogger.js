import { db } from '../db/database.js';
import crypto from 'crypto';

export function logAuditAction(userId, action, req, details = {}) {
  try {
    db.insert('audit_logs', {
      id: crypto.randomUUID(),
      user_id: userId,
      action,
      ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      user_agent: req.headers['user-agent'] || 'Unknown',
      details: JSON.stringify(details),
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to record audit log:', err);
  }
}
