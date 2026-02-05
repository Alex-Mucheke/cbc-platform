import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import db from '../db/index.js';
import { requireAuth, JWT_SECRET } from '../middleware/auth.js';

const router = Router();
const SALT_ROUNDS = 10;

function userToProfile(row) {
  return {
    id: row.id,
    user_type: row.user_type,
    full_name: row.full_name,
    avatar_url: row.avatar_url || undefined,
    phone_number: row.phone_number || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { email, password, fullName, userType } = req.body;
    if (!email || !password || !fullName || !userType) {
      return res.status(400).json({ error: 'Missing email, password, fullName, or userType' });
    }
    const validTypes = ['student', 'teacher', 'parent', 'admin'];
    if (!validTypes.includes(userType)) {
      return res.status(400).json({ error: 'Invalid userType' });
    }
    const e = String(email).trim().toLowerCase();
    const p = String(password).trim();
    if (p.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(e);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const id = randomUUID();
    const passwordHash = bcrypt.hashSync(p, SALT_ROUNDS);
    const now = new Date().toISOString();
    const fullNameTrim = String(fullName).trim();

    db.prepare(
      `INSERT INTO users (id, email, password_hash, full_name, user_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, e, passwordHash, fullNameTrim, userType, now, now);

    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    const profile = userToProfile(row);
    const token = jwt.sign({ id: row.id, email: row.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      user: { id: row.id, email: row.email },
      profile,
      token,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }
    const e = String(email).trim().toLowerCase();
    const p = String(password);

    const row = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(e);
    if (!row) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (!bcrypt.compareSync(p, row.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const profile = userToProfile(row);
    const token = jwt.sign({ id: row.id, email: row.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: { id: row.id, email: row.email },
      profile,
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me — current user + profile (requires Bearer token)
router.get('/me', requireAuth, (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }
    const profile = userToProfile(row);
    res.json({
      user: { id: row.id, email: row.email },
      profile,
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

export default router;
