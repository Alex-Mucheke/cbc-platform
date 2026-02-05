/**
 * Admin: pending library uploads, approve/reject.
 */

import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/admin/library — list by status (pending for approval queue)
router.get('/library', requireAuth, requireAdmin, (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const rows = db.prepare(`
      SELECT r.id, r.title, r.resource_type, r.description, r.status, r.created_at,
             r.grade_id, r.subject_id, r.strand_id, r.author, r.created_by,
             g.name AS grade_name, s.name AS subject_name,
             u.full_name AS created_by_name
      FROM library_resources r
      JOIN grades g ON r.grade_id = g.id
      JOIN subjects s ON r.subject_id = s.id
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.status = ?
      ORDER BY r.created_at DESC
    `).all(status);
    res.json(rows);
  } catch (err) {
    console.error('Admin library list:', err);
    res.status(500).json({ error: 'Failed to load' });
  }
});

// PATCH /api/admin/library/:id — approve resource (set status = approved)
router.patch('/library/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (status !== 'approved') {
      return res.status(400).json({ error: 'Only status=approved supported' });
    }
    const result = db.prepare(
      'UPDATE library_resources SET status = ?, updated_at = datetime(\'now\') WHERE id = ? AND status = \'pending\''
    ).run(status, id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Resource not found or already approved' });
    }
    res.json({ ok: true, status: 'approved' });
  } catch (err) {
    console.error('Admin approve:', err);
    res.status(500).json({ error: 'Failed to approve' });
  }
});

export default router;
