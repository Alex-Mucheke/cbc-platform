/**
 * Digital Library — CBC structure: Grade → Subject → Strand → Sub-Strand → Books.
 * Filter by grade, subject, strand, type; search; recently added, most used.
 * Teacher/Admin: upload book (teacher → pending, admin → approved).
 */

import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../db/index.js';
import { requireAuth, requireTeacherOrAdmin } from '../middleware/auth.js';

const router = Router();

const RESOURCE_TYPES = [
  'textbook', 'teacher_guide', 'workbook', 'revision_notes', 'summary_sheet',
  'past_paper', 'reader', 'interactive', 'activity_book',
];

// GET /api/library — list resources (approved only for public); filter grade_id, subject_id, strand_id, sub_strand_id, resource_type; search q=
router.get('/', (req, res) => {
  try {
    const { grade_id, subject_id, strand_id, sub_strand_id, resource_type, q, sort = 'recent' } = req.query;
    let sql = `
      SELECT r.id, r.title, r.description, r.resource_type, r.cover_url, r.author, r.publisher, r.page_count,
             r.view_count, r.download_count, r.created_at, r.marking_scheme_url, r.examiner_notes,
             g.name AS grade_name, s.name AS subject_name
      FROM library_resources r
      JOIN grades g ON r.grade_id = g.id
      JOIN subjects s ON r.subject_id = s.id
      WHERE r.status = 'approved'
    `;
    const params = [];
    if (grade_id) { params.push(grade_id); sql += ` AND r.grade_id = ?`; }
    if (subject_id) { params.push(subject_id); sql += ` AND r.subject_id = ?`; }
    if (strand_id) { params.push(strand_id); sql += ` AND r.strand_id = ?`; }
    if (sub_strand_id) { params.push(sub_strand_id); sql += ` AND r.sub_strand_id = ?`; }
    if (resource_type && RESOURCE_TYPES.includes(resource_type)) {
      params.push(resource_type);
      sql += ` AND r.resource_type = ?`;
    }
    if (q && String(q).trim()) {
      const qq = `%${String(q).trim()}%`;
      params.push(qq, qq, qq);
      sql += ` AND (r.title LIKE ? OR r.description LIKE ? OR r.tags LIKE ?)`;
    }
    if (sort === 'most_used') sql += ` ORDER BY r.view_count + r.download_count DESC, r.created_at DESC`;
    else sql += ` ORDER BY r.created_at DESC`;
    sql += ` LIMIT 100`;

    const rows = params.length ? db.prepare(sql).all(...params) : db.prepare(sql).all();
    res.json(rows);
  } catch (err) {
    console.error('Library list:', err);
    res.status(500).json({ error: 'Failed to list resources' });
  }
});

// GET /api/library/recent — recently added (limit 10)
router.get('/recent', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT r.id, r.title, r.resource_type, r.cover_url, r.created_at,
             g.name AS grade_name, s.name AS subject_name
      FROM library_resources r
      JOIN grades g ON r.grade_id = g.id
      JOIN subjects s ON r.subject_id = s.id
      WHERE r.status = 'approved'
      ORDER BY r.created_at DESC LIMIT 10
    `).all();
    res.json(rows);
  } catch (err) {
    console.error('Library recent:', err);
    res.status(500).json({ error: 'Failed to load' });
  }
});

// GET /api/library/most-used — most used (limit 10)
router.get('/most-used', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT r.id, r.title, r.resource_type, r.cover_url, r.view_count, r.download_count,
             g.name AS grade_name, s.name AS subject_name
      FROM library_resources r
      JOIN grades g ON r.grade_id = g.id
      JOIN subjects s ON r.subject_id = s.id
      WHERE r.status = 'approved'
      ORDER BY r.view_count + r.download_count DESC LIMIT 10
    `).all();
    res.json(rows);
  } catch (err) {
    console.error('Library most-used:', err);
    res.status(500).json({ error: 'Failed to load' });
  }
});

// GET /api/library/types — resource types for filter (must be before /:id)
router.get('/types', (req, res) => {
  res.json(RESOURCE_TYPES.map((t) => ({ id: t, label: t.replace(/_/g, ' ') })));
});

// POST /api/library — upload/create book (teacher → pending, admin → approved)
router.post('/', requireAuth, requireTeacherOrAdmin, (req, res) => {
  try {
    const userId = req.user.id;
    const profile = db.prepare('SELECT user_type FROM users WHERE id = ?').get(userId);
    const isAdmin = profile?.user_type === 'admin';
    const {
      grade_id, subject_id, strand_id, sub_strand_id, resource_type, title,
      description, tags, author, publisher, page_count, file_path, file_type,
      toc_json, chapters_json, marking_scheme_url, examiner_notes,
    } = req.body;
    if (!grade_id || !subject_id || !resource_type || !title) {
      return res.status(400).json({ error: 'grade_id, subject_id, resource_type, title required' });
    }
    if (!RESOURCE_TYPES.includes(resource_type)) {
      return res.status(400).json({ error: 'Invalid resource_type' });
    }
    const id = randomUUID();
    const status = isAdmin ? 'approved' : 'pending';
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO library_resources (
        id, grade_id, subject_id, strand_id, sub_strand_id, resource_type, title,
        description, file_path, file_type, toc_json, chapters_json, tags,
        author, publisher, page_count, marking_scheme_url, examiner_notes,
        created_by, status, view_count, download_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
    `).run(
      id, grade_id, subject_id || null, strand_id || null, sub_strand_id || null,
      resource_type, title, description || null, file_path || null, file_type || null,
      toc_json ? JSON.stringify(toc_json) : null, chapters_json ? JSON.stringify(chapters_json) : null,
      tags || null, author || null, publisher || null, page_count ? parseInt(page_count, 10) : null,
      marking_scheme_url || null, examiner_notes || null, userId, status, now, now,
    );
    res.status(201).json({ id, status });
  } catch (err) {
    console.error('Library create:', err);
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

// GET /api/library/my-uploads — teacher/admin: list my uploads (pending + approved)
router.get('/my-uploads', requireAuth, requireTeacherOrAdmin, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT r.id, r.title, r.resource_type, r.status, r.created_at,
             g.name AS grade_name, s.name AS subject_name
      FROM library_resources r
      JOIN grades g ON r.grade_id = g.id
      JOIN subjects s ON r.subject_id = s.id
      WHERE r.created_by = ?
      ORDER BY r.created_at DESC
    `).all(req.user.id);
    res.json(rows);
  } catch (err) {
    console.error('My uploads:', err);
    res.status(500).json({ error: 'Failed to load' });
  }
});

// GET /api/library/:id — get one resource (increment view_count)
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const row = db.prepare(`
      SELECT r.*, g.name AS grade_name, s.name AS subject_name
      FROM library_resources r
      JOIN grades g ON r.grade_id = g.id
      JOIN subjects s ON r.subject_id = s.id
      WHERE r.id = ? AND r.status = 'approved'
    `).get(id);
    if (!row) return res.status(404).json({ error: 'Resource not found' });
    db.prepare('UPDATE library_resources SET view_count = view_count + 1 WHERE id = ?').run(id);
    row.view_count = (row.view_count ?? 0) + 1;
    res.json(row);
  } catch (err) {
    console.error('Library get:', err);
    res.status(500).json({ error: 'Failed to load resource' });
  }
});

export default router;
