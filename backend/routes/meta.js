/**
 * Meta: subjects and grades for filters.
 */

import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

router.get('/subjects', (_, res) => {
  try {
    const rows = db.prepare('SELECT id, name, code FROM subjects ORDER BY name').all();
    res.json(rows);
  } catch (err) {
    console.error('Subjects:', err);
    res.status(500).json({ error: 'Failed to load subjects' });
  }
});

router.get('/grades', (_, res) => {
  try {
    const rows = db.prepare('SELECT id, name, sort_order FROM grades ORDER BY sort_order').all();
    res.json(rows);
  } catch (err) {
    console.error('Grades:', err);
    res.status(500).json({ error: 'Failed to load grades' });
  }
});

router.get('/strands', (req, res) => {
  try {
    const { grade_id, subject_id } = req.query;
    let sql = 'SELECT id, subject_id, grade_id, name, sort_order FROM strands WHERE 1=1';
    const params = [];
    if (grade_id) { params.push(grade_id); sql += ' AND grade_id = ?'; }
    if (subject_id) { params.push(subject_id); sql += ' AND subject_id = ?'; }
    sql += ' ORDER BY sort_order';
    const rows = params.length ? db.prepare(sql).all(...params) : db.prepare(sql).all();
    res.json(rows);
  } catch (err) {
    console.error('Strands:', err);
    res.status(500).json({ error: 'Failed to load strands' });
  }
});

router.get('/sub-strands', (req, res) => {
  try {
    const { strand_id } = req.query;
    let sql = 'SELECT id, strand_id, name, sort_order FROM sub_strands WHERE 1=1';
    const params = [];
    if (strand_id) { params.push(strand_id); sql += ' AND strand_id = ?'; }
    sql += ' ORDER BY sort_order';
    const rows = params.length ? db.prepare(sql).all(...params) : db.prepare(sql).all();
    res.json(rows);
  } catch (err) {
    console.error('Sub-strands:', err);
    res.status(500).json({ error: 'Failed to load sub-strands' });
  }
});

export default router;
