/**
 * Sitting Exam — written exams: list, start submission, autosave answers, submit, teacher marking.
 */

import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { recordExamSubmit, recordExamMarked } from '../services/engagement.js';

const router = Router();

// GET /api/written-exams — list written exams (with subject, grade, exam_mode); filter exam_mode, grade_id, subject_id
router.get('/', (req, res) => {
  try {
    const { exam_mode, grade_id, subject_id } = req.query;
    let sql = `
      SELECT e.id, e.title, e.duration_minutes, e.one_attempt_only, e.exam_mode, e.created_at,
             s.name AS subject_name, g.name AS grade_name
      FROM written_exams e
      JOIN subjects s ON e.subject_id = s.id
      JOIN grades g ON e.grade_id = g.id
      WHERE 1=1
    `;
    const params = [];
    if (exam_mode) { params.push(exam_mode); sql += ' AND e.exam_mode = ?'; }
    if (grade_id) { params.push(grade_id); sql += ' AND e.grade_id = ?'; }
    if (subject_id) { params.push(subject_id); sql += ' AND e.subject_id = ?'; }
    sql += ' ORDER BY e.created_at DESC';
    const rows = params.length ? db.prepare(sql).all(...params) : db.prepare(sql).all();
    res.json(rows);
  } catch (err) {
    console.error('List written exams:', err);
    res.status(500).json({ error: 'Failed to list exams' });
  }
});

// ——— Literal paths before /:id ———
// GET /api/written-exams/submissions/mine
router.get('/submissions/mine', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const { exam_id: examId } = req.query;

    let rows;
    if (examId) {
      rows = db
        .prepare(
          `SELECT s.id, s.exam_id, s.started_at, s.submitted_at, s.status, s.time_taken_seconds,
                  e.title AS exam_title, e.duration_minutes
           FROM written_submissions s
           JOIN written_exams e ON s.exam_id = e.id
           WHERE s.user_id = ? AND s.exam_id = ? ORDER BY s.started_at DESC`
        )
        .all(userId, examId);
    } else {
      rows = db
        .prepare(
          `SELECT s.id, s.exam_id, s.started_at, s.submitted_at, s.status, s.time_taken_seconds,
                  e.title AS exam_title, e.duration_minutes
           FROM written_submissions s
           JOIN written_exams e ON s.exam_id = e.id
           WHERE s.user_id = ? ORDER BY s.started_at DESC`
        )
        .all(userId);
    }
    res.json(rows);
  } catch (err) {
    console.error('My submissions:', err);
    res.status(500).json({ error: 'Failed to list submissions' });
  }
});

// GET /api/written-exams/submissions/to-mark/list
router.get('/submissions/to-mark/list', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const profile = db.prepare('SELECT user_type FROM users WHERE id = ?').get(userId);
    if (profile?.user_type !== 'teacher' && profile?.user_type !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const rows = db
      .prepare(
        `SELECT s.id, s.exam_id, s.user_id, s.started_at, s.submitted_at, s.status,
                e.title AS exam_title, u.full_name AS student_name, u.email AS student_email
         FROM written_submissions s
         JOIN written_exams e ON s.exam_id = e.id
         JOIN users u ON s.user_id = u.id
         WHERE s.status IN ('submitted', 'marked')
         ORDER BY s.submitted_at DESC`
      )
      .all();

    res.json(rows);
  } catch (err) {
    console.error('List to mark:', err);
    res.status(500).json({ error: 'Failed to list submissions' });
  }
});

// GET /api/written-exams/submissions/:submissionId
router.get('/submissions/:submissionId', requireAuth, (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;

    const sub = db.prepare('SELECT * FROM written_submissions WHERE id = ?').get(submissionId);
    if (!sub) return res.status(404).json({ error: 'Submission not found' });

    const profile = db.prepare('SELECT user_type FROM users WHERE id = ?').get(userId);
    const isTeacher = profile?.user_type === 'teacher' || profile?.user_type === 'admin';
    if (sub.user_id !== userId && !isTeacher) return res.status(403).json({ error: 'Forbidden' });

    const exam = db.prepare('SELECT * FROM written_exams WHERE id = ?').get(sub.exam_id);
    const student = db.prepare('SELECT full_name FROM users WHERE id = ?').get(sub.user_id);
    const questions = db
      .prepare('SELECT id, question_text, max_marks, sort_order FROM written_questions WHERE exam_id = ? ORDER BY sort_order')
      .all(sub.exam_id);

    const answers = db
      .prepare('SELECT question_id, answer_text, updated_at FROM written_submission_answers WHERE submission_id = ?')
      .all(submissionId);
    const answersByQ = Object.fromEntries(answers.map((a) => [a.question_id, { answer_text: a.answer_text, updated_at: a.updated_at }]));

    const marks = db
      .prepare('SELECT question_id, marks_awarded, max_marks, comment, marked_at FROM marks_reviews WHERE submission_id = ?')
      .all(submissionId);
    const marksByQ = Object.fromEntries(marks.map((m) => [m.question_id, m]));

    const questionsWithData = questions.map((q) => ({
      ...q,
      answer_text: answersByQ[q.id]?.answer_text ?? '',
      answer_updated_at: answersByQ[q.id]?.updated_at,
      marks_awarded: marksByQ[q.id]?.marks_awarded,
      marks_comment: marksByQ[q.id]?.comment,
      marked_at: marksByQ[q.id]?.marked_at,
    }));

    const totalMarksAwarded = marks.reduce((s, m) => s + (m.marks_awarded ?? 0), 0);
    const totalMaxMarks = questions.reduce((s, q) => s + q.max_marks, 0);

    res.json({
      ...sub,
      exam_title: exam?.title,
      duration_minutes: exam?.duration_minutes,
      student_name: student?.full_name ?? null,
      questions: questionsWithData,
      total_marks_awarded: totalMarksAwarded,
      total_max_marks: totalMaxMarks,
    });
  } catch (err) {
    console.error('Get submission:', err);
    res.status(500).json({ error: 'Failed to load submission' });
  }
});

// PATCH /api/written-exams/submissions/:submissionId (autosave)
router.patch('/submissions/:submissionId', requireAuth, (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;
    const { answers } = req.body || {};

    const sub = db.prepare('SELECT * FROM written_submissions WHERE id = ? AND user_id = ?').get(submissionId, userId);
    if (!sub) return res.status(404).json({ error: 'Submission not found' });
    if (sub.status !== 'in_progress') return res.status(400).json({ error: 'Submission already submitted' });

    if (Array.isArray(answers)) {
      const now = new Date().toISOString();
      for (const { question_id: qId, answer_text: text } of answers) {
        if (!qId) continue;
        const existing = db
          .prepare('SELECT id FROM written_submission_answers WHERE submission_id = ? AND question_id = ?')
          .get(submissionId, qId);
        const safeText = String(text ?? '').slice(0, 50000);
        if (existing) {
          db.prepare('UPDATE written_submission_answers SET answer_text = ?, updated_at = ? WHERE id = ?').run(safeText, now, existing.id);
        } else {
          db.prepare(
            'INSERT INTO written_submission_answers (id, submission_id, question_id, answer_text, updated_at) VALUES (?, ?, ?, ?, ?)'
          ).run(randomUUID(), submissionId, qId, safeText, now);
        }
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Autosave:', err);
    res.status(500).json({ error: 'Failed to save answers' });
  }
});

// POST /api/written-exams/submissions/:submissionId/submit
router.post('/submissions/:submissionId/submit', requireAuth, (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;

    const sub = db.prepare('SELECT * FROM written_submissions WHERE id = ? AND user_id = ?').get(submissionId, userId);
    if (!sub) return res.status(404).json({ error: 'Submission not found' });
    if (sub.status !== 'in_progress') return res.status(400).json({ error: 'Already submitted' });

    const startedAt = new Date(sub.started_at).getTime();
    const timeTakenSeconds = Math.round((Date.now() - startedAt) / 1000);

    db.prepare(
      'UPDATE written_submissions SET submitted_at = datetime(\'now\'), status = ?, time_taken_seconds = ? WHERE id = ?'
    ).run('submitted', timeTakenSeconds, submissionId);

    try {
      recordExamSubmit(userId, { exam_id: sub.exam_id });
    } catch (_) {}

    res.json({ ok: true, status: 'submitted' });
  } catch (err) {
    console.error('Submit exam:', err);
    res.status(500).json({ error: 'Failed to submit' });
  }
});

// PATCH /api/written-exams/submissions/:submissionId/mark
router.patch('/submissions/:submissionId/mark', requireAuth, (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;
    const { reviews } = req.body || {};

    const profile = db.prepare('SELECT user_type FROM users WHERE id = ?').get(userId);
    if (profile?.user_type !== 'teacher' && profile?.user_type !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const sub = db.prepare('SELECT * FROM written_submissions WHERE id = ?').get(submissionId);
    if (!sub) return res.status(404).json({ error: 'Submission not found' });
    if (sub.status === 'in_progress') return res.status(400).json({ error: 'Exam not yet submitted' });

    if (Array.isArray(reviews)) {
      for (const { question_id: qId, marks_awarded, max_marks, comment } of reviews) {
        if (!qId) continue;
        const q = db.prepare('SELECT id, max_marks FROM written_questions WHERE id = ? AND exam_id = ?').get(qId, sub.exam_id);
        if (!q) continue;
        const max = max_marks ?? q.max_marks;
        const awarded = Math.min(Math.max(Number(marks_awarded) || 0, 0), max);

        const existing = db.prepare('SELECT id FROM marks_reviews WHERE submission_id = ? AND question_id = ?').get(submissionId, qId);
        if (existing) {
          db.prepare('UPDATE marks_reviews SET marks_awarded = ?, max_marks = ?, comment = ?, marked_by = ?, marked_at = datetime(\'now\') WHERE id = ?').run(awarded, max, comment ?? null, userId, existing.id);
        } else {
          db.prepare(
            'INSERT INTO marks_reviews (id, submission_id, question_id, marks_awarded, max_marks, comment, marked_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
          ).run(randomUUID(), submissionId, qId, awarded, max, comment ?? null, userId);
        }
      }
    }

    db.prepare('UPDATE written_submissions SET status = ? WHERE id = ?').run('marked', submissionId);

    const totals = db.prepare(
      'SELECT SUM(marks_awarded) AS awarded, SUM(max_marks) AS max_marks FROM marks_reviews WHERE submission_id = ?'
    ).get(submissionId);
    if (totals?.max_marks > 0 && sub.user_id) {
      try {
        recordExamMarked(sub.user_id, { score: totals.awarded || 0, total: totals.max_marks });
      } catch (_) {}
    }

    res.json({ ok: true, status: 'marked' });
  } catch (err) {
    console.error('Mark submission:', err);
    res.status(500).json({ error: 'Failed to save marks' });
  }
});

// GET /api/written-exams/:id — get exam with questions (fixed order)
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const exam = db.prepare('SELECT * FROM written_exams WHERE id = ?').get(id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const questions = db
      .prepare('SELECT id, question_text, max_marks, sort_order FROM written_questions WHERE exam_id = ? ORDER BY sort_order')
      .all(id);

    const subject = db.prepare('SELECT name FROM subjects WHERE id = ?').get(exam.subject_id);
    const grade = db.prepare('SELECT name FROM grades WHERE id = ?').get(exam.grade_id);

    res.json({
      ...exam,
      subject_name: subject?.name,
      grade_name: grade?.name,
      questions,
    });
  } catch (err) {
    console.error('Get exam:', err);
    res.status(500).json({ error: 'Failed to load exam' });
  }
});

// POST /api/written-exams/:id/submissions — start a submission
router.post('/:id/submissions', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const examId = req.params.id;

    const exam = db.prepare('SELECT * FROM written_exams WHERE id = ?').get(examId);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    if (exam.one_attempt_only) {
      const existing = db
        .prepare('SELECT id FROM written_submissions WHERE exam_id = ? AND user_id = ?')
        .get(examId, userId);
      if (existing) return res.status(409).json({ error: 'You already have one attempt for this exam.' });
    }

    const submissionId = randomUUID();
    db.prepare(
      'INSERT INTO written_submissions (id, exam_id, user_id, status) VALUES (?, ?, ?, ?)'
    ).run(submissionId, examId, userId, 'in_progress');

    const questions = db
      .prepare('SELECT id FROM written_questions WHERE exam_id = ? ORDER BY sort_order')
      .all(examId);

    res.status(201).json({
      submission_id: submissionId,
      exam_id: examId,
      duration_minutes: exam.duration_minutes,
      question_ids: questions.map((q) => q.id),
    });
  } catch (err) {
    console.error('Start submission:', err);
    res.status(500).json({ error: 'Failed to start exam' });
  }
});

export default router;
