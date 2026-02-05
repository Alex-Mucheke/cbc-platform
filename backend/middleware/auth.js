import jwt from 'jsonwebtoken';
import db from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'cbc-dev-secret-change-in-production';

/**
 * Verify Bearer token and attach req.user = { id, email }.
 */
export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization' });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Require admin. Use after requireAuth. Attaches req.userType.
 */
export function requireAdmin(req, res, next) {
  try {
    const row = db.prepare('SELECT user_type FROM users WHERE id = ?').get(req.user.id);
    if (row?.user_type !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    req.userType = row.user_type;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify role' });
  }
}

/**
 * Require teacher or admin. Use after requireAuth.
 */
export function requireTeacherOrAdmin(req, res, next) {
  try {
    const row = db.prepare('SELECT user_type FROM users WHERE id = ?').get(req.user.id);
    if (row?.user_type !== 'teacher' && row?.user_type !== 'admin') {
      return res.status(403).json({ error: 'Teacher or admin only' });
    }
    req.userType = row.user_type;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify role' });
  }
}

export { JWT_SECRET };
