/**
 * Master question bank — list/filter questions; exam generator (create quiz from bank).
 */

import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/question-bank — list questions (filter grade_id, subject_id, strand_id, difficulty, question_type)
router.get('/', (req, res) => {
  try {
    const { grade_id, subject_id, strand_id, difficulty, question_type } = req.query;
    let sql = `
      SELECT q.id, q.grade_id, q.subject_id, q.strand_id, q.sub_strand_id, q.difficulty, q.skill_tested,
             q.question_type, q.question_text, q.options_json, q.correct_option_id, q.explanation, q.created_at,
             g.name AS grade_name, s.name AS subject_name
      FROM question_bank q
      JOIN grades g ON q.grade_id = g.id
      JOIN subjects s ON q.subject_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (grade_id) { params.push(grade_id); sql += ' AND q.grade_id = ?'; }
    if (subject_id) { params.push(subject_id); sql += ' AND q.subject_id = ?'; }
    if (strand_id) { params.push(strand_id); sql += ' AND q.strand_id = ?'; }
    if (difficulty) { params.push(difficulty); sql += ' AND q.difficulty = ?'; }
    if (question_type) { params.push(question_type); sql += ' AND q.question_type = ?'; }
    sql += ' ORDER BY q.created_at DESC LIMIT 200';
    const rows = params.length ? db.prepare(sql).all(...params) : db.prepare(sql).all();
    res.json(rows);
  } catch (err) {
    console.error('Question bank list:', err);
    res.status(500).json({ error: 'Failed to list questions' });
  }
});

// POST /api/question-bank — add question (teacher/admin)
router.post('/', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const profile = db.prepare('SELECT user_type FROM users WHERE id = ?').get(userId);
    if (profile?.user_type !== 'teacher' && profile?.user_type !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { grade_id, subject_id, strand_id, sub_strand_id, difficulty, skill_tested, question_type, question_text, options_json, correct_option_id, explanation } = req.body;
    if (!grade_id || !subject_id || !question_text || !question_type) {
      return res.status(400).json({ error: 'grade_id, subject_id, question_text, question_type required' });
    }
    const id = randomUUID();
    db.prepare(`
      INSERT INTO question_bank (id, grade_id, subject_id, strand_id, sub_strand_id, difficulty, skill_tested, question_type, question_text, options_json, correct_option_id, explanation, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, grade_id, subject_id || null, strand_id || null, sub_strand_id || null, difficulty || 'basic', skill_tested || null, question_type, question_text, options_json ? JSON.stringify(options_json) : null, correct_option_id || null, explanation || null, userId);
    res.status(201).json({ id });
  } catch (err) {
    console.error('Question bank add:', err);
    res.status(500).json({ error: 'Failed to add question' });
  }
});

// POST /api/question-bank/generate-quiz — exam generator: create quiz from bank (grade_id, subject_id, count, difficulty_mix)
router.post('/generate-quiz', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const profile = db.prepare('SELECT user_type FROM users WHERE id = ?').get(userId);
    if (profile?.user_type !== 'teacher' && profile?.user_type !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { grade_id, subject_id, strand_id, title, count = 10, difficulty_mix = 'mixed', timer_seconds = 60, exam_mode = 'topic_quiz' } = req.body;
    if (!grade_id || !subject_id || !title) {
      return res.status(400).json({ error: 'grade_id, subject_id, title required' });
    }
    const validModes = ['topic_quiz', 'end_of_strand', 'end_of_term', 'mock_national', 'timed_drill', 'remedial', 'challenge'];
    const mode = validModes.includes(exam_mode) ? exam_mode : 'topic_quiz';
    let sql = `SELECT * FROM question_bank WHERE grade_id = ? AND subject_id = ? AND question_type IN ('multiple_choice', 'true_false')`;
    const params = [grade_id, subject_id];
    if (strand_id) { params.push(strand_id); sql += ' AND strand_id = ?'; }
    if (difficulty_mix === 'basic') { params.push('basic'); sql += ' AND difficulty = ?'; }
    else if (difficulty_mix === 'intermediate') { params.push('intermediate'); sql += ' AND difficulty = ?'; }
    else if (difficulty_mix === 'advanced') { params.push('advanced'); sql += ' AND difficulty = ?'; }
    params.push(Math.min(Number(count) || 10, 50));
    sql += ' ORDER BY RANDOM() LIMIT ?';
    const bankQuestions = db.prepare(sql).all(...params);
    if (bankQuestions.length === 0) {
      return res.status(400).json({ error: 'No questions in bank for this grade/subject' + (strand_id ? '/strand' : '') });
    }
    const quizId = randomUUID();
    const difficulty = difficulty_mix === 'advanced' ? 'advanced' : difficulty_mix === 'basic' ? 'basic' : 'intermediate';
    db.prepare(`
      INSERT INTO quizzes (id, title, subject_id, grade_id, strand_id, difficulty, exam_mode, timer_seconds, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(quizId, title, subject_id, grade_id, strand_id || null, difficulty, mode, timer_seconds || 60, userId);
    let sortOrder = 0;
    for (const bq of bankQuestions) {
      const qId = randomUUID();
      db.prepare(`
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, sort_order, explanation)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(qId, quizId, bq.question_text, bq.question_type, ++sortOrder, bq.explanation);
      const options = bq.options_json ? (typeof bq.options_json === 'string' ? JSON.parse(bq.options_json) : bq.options_json) : [];
      if (Array.isArray(options) && options.length > 0) {
        options.forEach((opt, i) => {
          const optId = randomUUID();
          const isCorrect = (opt.id && opt.id === bq.correct_option_id) || (opt.is_correct) ? 1 : 0;
          const text = typeof opt === 'string' ? opt : (opt.text || opt.option_text || '');
          db.prepare('INSERT INTO quiz_options (id, question_id, option_text, is_correct, sort_order) VALUES (?, ?, ?, ?, ?)').run(optId, qId, text, isCorrect, i + 1);
        });
      } else if (bq.question_type === 'true_false') {
        ['True', 'False'].forEach((text, i) => {
          const optId = randomUUID();
          const isCorrect = (String(bq.correct_option_id || '').toLowerCase() === 'true' && text === 'True') || (String(bq.correct_option_id || '').toLowerCase() === 'false' && text === 'False') ? 1 : 0;
          db.prepare('INSERT INTO quiz_options (id, question_id, option_text, is_correct, sort_order) VALUES (?, ?, ?, ?, ?)').run(optId, qId, text, isCorrect, i + 1);
        });
      }
    }
    res.status(201).json({ quiz_id: quizId, questions_added: bankQuestions.length });
  } catch (err) {
    console.error('Generate quiz:', err);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

export default router;
