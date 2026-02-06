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

// Term planner: terms per grade, weeks per term
router.get('/terms', (req, res) => {
  try {
    const { grade_id } = req.query;
    let sql = 'SELECT id, grade_id, name, term_number, start_date, end_date, sort_order FROM terms WHERE 1=1';
    const params = [];
    if (grade_id) { params.push(grade_id); sql += ' AND grade_id = ?'; }
    sql += ' ORDER BY sort_order';
    const rows = params.length ? db.prepare(sql).all(...params) : db.prepare(sql).all();
    res.json(rows);
  } catch (err) {
    console.error('Terms:', err);
    res.status(500).json({ error: 'Failed to load terms' });
  }
});

router.get('/term-weeks', (req, res) => {
  try {
    const { term_id } = req.query;
    if (!term_id) {
      return res.status(400).json({ error: 'term_id required' });
    }
    const rows = db
      .prepare(
        'SELECT id, term_id, week_number, title, start_date, end_date, sort_order FROM term_weeks WHERE term_id = ? ORDER BY sort_order'
      )
      .all(term_id);
    res.json(rows);
  } catch (err) {
    console.error('Term weeks:', err);
    res.status(500).json({ error: 'Failed to load term weeks' });
  }
});

// Timetable: slots per grade (day_of_week 1=Mon .. 5=Fri), with subject name
router.get('/timetable', (req, res) => {
  try {
    const { grade_id } = req.query;
    if (!grade_id) {
      return res.status(400).json({ error: 'grade_id required' });
    }
    const rows = db
      .prepare(
        `SELECT t.id, t.grade_id, t.day_of_week, t.start_time, t.end_time, t.subject_id, s.name AS subject_name, t.title, t.strand_id, t.competency_hint, t.link_type, t.link_id, t.is_suggested, t.sort_order
         FROM timetable_slots t
         JOIN subjects s ON t.subject_id = s.id
         WHERE t.grade_id = ?
         ORDER BY t.day_of_week, t.sort_order, t.start_time`
      )
      .all(grade_id);
    res.json(rows);
  } catch (err) {
    console.error('Timetable:', err);
    res.status(500).json({ error: 'Failed to load timetable' });
  }
});

// Calendar: events in date range (grade_id optional; null events = holidays for all)
router.get('/calendar/events', (req, res) => {
  try {
    const { grade_id, start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'start and end (YYYY-MM-DD) required' });
    }
    let rows;
    if (grade_id) {
      rows = db
        .prepare(
          `SELECT id, grade_id, subject_id, title, event_type, date, start_time, end_time, entity_type, entity_id, description, term_id, competency_hint
           FROM calendar_events
           WHERE (grade_id = ? OR grade_id IS NULL) AND date >= ? AND date <= ?
           ORDER BY date, start_time`
        )
        .all(grade_id, start, end);
    } else {
      rows = db
        .prepare(
          `SELECT id, grade_id, subject_id, title, event_type, date, start_time, end_time, entity_type, entity_id, description, term_id, competency_hint
           FROM calendar_events
           WHERE date >= ? AND date <= ?
           ORDER BY date, start_time`
        )
        .all(start, end);
    }
    res.json(rows);
  } catch (err) {
    console.error('Calendar events:', err);
    res.status(500).json({ error: 'Failed to load calendar events' });
  }
});

export default router;
