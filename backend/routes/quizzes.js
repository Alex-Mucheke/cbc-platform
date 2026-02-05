/**
 * Jiggle Your Mind — practice quizzes: list, start attempt, submit answer (instant feedback), complete (score summary).
 */

import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { recordQuizComplete } from '../services/engagement.js';

const router = Router();

// GET /api/quizzes — list quizzes (with subject, grade, exam_mode); filter exam_mode, grade_id, subject_id
router.get('/', (req, res) => {
  try {
    const { exam_mode, grade_id, subject_id } = req.query;
    let sql = `
      SELECT q.id, q.title, q.difficulty, q.exam_mode, q.timer_seconds, q.created_at,
             s.name AS subject_name, s.code AS subject_code,
             g.name AS grade_name
      FROM quizzes q
      JOIN subjects s ON q.subject_id = s.id
      JOIN grades g ON q.grade_id = g.id
      WHERE 1=1
    `;
    const params = [];
    if (exam_mode) { params.push(exam_mode); sql += ' AND q.exam_mode = ?'; }
    if (grade_id) { params.push(grade_id); sql += ' AND q.grade_id = ?'; }
    if (subject_id) { params.push(subject_id); sql += ' AND q.subject_id = ?'; }
    sql += ' ORDER BY q.created_at DESC';
    const rows = params.length ? db.prepare(sql).all(...params) : db.prepare(sql).all();
    res.json(rows);
  } catch (err) {
    console.error('List quizzes:', err);
    res.status(500).json({ error: 'Failed to list quizzes' });
  }
});

// GET /api/quizzes/attempts/mine — list my attempts (optional ?quiz_id=)
router.get('/attempts/mine', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const { quiz_id: quizId } = req.query;

    let rows;
    if (quizId) {
      rows = db
        .prepare(
          `SELECT a.id, a.quiz_id, a.started_at, a.completed_at, a.score, a.total_questions, a.time_taken_seconds
           FROM quiz_attempts a WHERE a.user_id = ? AND a.quiz_id = ? ORDER BY a.started_at DESC`
        )
        .all(userId, quizId);
    } else {
      rows = db
        .prepare(
          `SELECT a.id, a.quiz_id, a.started_at, a.completed_at, a.score, a.total_questions, a.time_taken_seconds,
                  q.title AS quiz_title
           FROM quiz_attempts a
           JOIN quizzes q ON a.quiz_id = q.id
           WHERE a.user_id = ? ORDER BY a.started_at DESC`
        )
        .all(userId);
    }
    res.json(rows);
  } catch (err) {
    console.error('My attempts:', err);
    res.status(500).json({ error: 'Failed to list attempts' });
  }
});

// GET /api/quizzes/attempts/:attemptId
router.get('/attempts/:attemptId', requireAuth, (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;

    const attempt = db.prepare('SELECT * FROM quiz_attempts WHERE id = ? AND user_id = ?').get(attemptId, userId);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.completed_at) return res.status(400).json({ error: 'Attempt already completed' });

    const answeredIds = db
      .prepare('SELECT question_id FROM quiz_attempt_answers WHERE attempt_id = ?')
      .all(attemptId)
      .map((r) => r.question_id);

    const allIds = db
      .prepare('SELECT id FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order')
      .all(attempt.quiz_id)
      .map((r) => r.id);

    const quiz = db.prepare('SELECT timer_seconds FROM quizzes WHERE id = ?').get(attempt.quiz_id);

    res.json({
      attempt_id: attemptId,
      quiz_id: attempt.quiz_id,
      timer_seconds: quiz?.timer_seconds ?? 60,
      total_questions: attempt.total_questions,
      answered_count: answeredIds.length,
      question_ids: allIds,
      answered_ids: answeredIds,
    });
  } catch (err) {
    console.error('Get attempt:', err);
    res.status(500).json({ error: 'Failed to get attempt' });
  }
});

// POST /api/quizzes/attempts/:attemptId/answer
router.post('/attempts/:attemptId/answer', requireAuth, (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;
    const { question_id: questionId, option_id: optionId } = req.body;

    if (!questionId) return res.status(400).json({ error: 'question_id required' });

    const attempt = db.prepare('SELECT * FROM quiz_attempts WHERE id = ? AND user_id = ?').get(attemptId, userId);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.completed_at) return res.status(400).json({ error: 'Attempt already completed' });

    const already = db
      .prepare('SELECT id FROM quiz_attempt_answers WHERE attempt_id = ? AND question_id = ?')
      .get(attemptId, questionId);
    if (already) return res.status(400).json({ error: 'Question already answered' });

    const question = db.prepare('SELECT id, quiz_id, question_type, explanation FROM quiz_questions WHERE id = ?').get(questionId);
    if (!question || question.quiz_id !== attempt.quiz_id) return res.status(404).json({ error: 'Question not found' });

    let isCorrect = 0;
    if (question.question_type === 'true_false' && optionId) {
      const opt = db.prepare('SELECT is_correct FROM quiz_options WHERE id = ? AND question_id = ?').get(optionId, questionId);
      isCorrect = opt?.is_correct ?? 0;
    } else if (question.question_type === 'multiple_choice' && optionId) {
      const opt = db.prepare('SELECT is_correct FROM quiz_options WHERE id = ? AND question_id = ?').get(optionId, questionId);
      isCorrect = opt?.is_correct ?? 0;
    }

    const answerId = randomUUID();
    db.prepare(
      'INSERT INTO quiz_attempt_answers (id, attempt_id, question_id, option_id, is_correct) VALUES (?, ?, ?, ?, ?)'
    ).run(answerId, attemptId, questionId, optionId || null, isCorrect);

    res.status(201).json({
      is_correct: !!isCorrect,
      explanation: question.explanation || null,
    });
  } catch (err) {
    console.error('Submit answer:', err);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// POST /api/quizzes/attempts/:attemptId/complete
router.post('/attempts/:attemptId/complete', requireAuth, (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;

    const attempt = db.prepare('SELECT * FROM quiz_attempts WHERE id = ? AND user_id = ?').get(attemptId, userId);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.completed_at) return res.status(400).json({ error: 'Attempt already completed' });

    const correctCount = db
      .prepare('SELECT COUNT(*) AS n FROM quiz_attempt_answers WHERE attempt_id = ? AND is_correct = 1')
      .get(attemptId).n;
    const answeredCount = db
      .prepare('SELECT COUNT(*) AS n FROM quiz_attempt_answers WHERE attempt_id = ?')
      .get(attemptId).n;

    const completedAt = new Date().toISOString();
    const startedAt = new Date(attempt.started_at).getTime();
    const timeTakenSeconds = Math.round((Date.now() - startedAt) / 1000);

    db.prepare(
      'UPDATE quiz_attempts SET completed_at = ?, score = ?, time_taken_seconds = ? WHERE id = ?'
    ).run(completedAt, correctCount, timeTakenSeconds, attemptId);

    try {
      recordQuizComplete(userId, {
        quiz_id: attempt.quiz_id,
        score: correctCount,
        total: attempt.total_questions,
      });
    } catch (_) {}

    res.json({
      attempt_id: attemptId,
      score: correctCount,
      total_questions: attempt.total_questions,
      time_taken_seconds: timeTakenSeconds,
      answered_count: answeredCount,
    });
  } catch (err) {
    console.error('Complete attempt:', err);
    res.status(500).json({ error: 'Failed to complete attempt' });
  }
});

// GET /api/quizzes/:id — get quiz with questions and options
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const questions = db
      .prepare(
        'SELECT id, question_text, question_type, sort_order, explanation FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order'
      )
      .all(id);

    const questionsWithOptions = questions.map((q) => {
      const options = db
        .prepare('SELECT id, option_text, is_correct, sort_order FROM quiz_options WHERE question_id = ? ORDER BY sort_order')
        .all(q.id);
      return { ...q, options };
    });

    const subject = db.prepare('SELECT name, code FROM subjects WHERE id = ?').get(quiz.subject_id);
    const grade = db.prepare('SELECT name FROM grades WHERE id = ?').get(quiz.grade_id);

    res.json({
      ...quiz,
      subject_name: subject?.name,
      grade_name: grade?.name,
      questions: questionsWithOptions,
    });
  } catch (err) {
    console.error('Get quiz:', err);
    res.status(500).json({ error: 'Failed to load quiz' });
  }
});

// POST /api/quizzes/:id/attempts — start a new attempt (returns attempt id + questions in random order)
router.post('/:id/attempts', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const quizId = req.params.id;

    const quiz = db.prepare('SELECT id, timer_seconds FROM quizzes WHERE id = ?').get(quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const questions = db
      .prepare('SELECT id FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order')
      .all(quizId);
    if (questions.length === 0) return res.status(400).json({ error: 'Quiz has no questions' });

    const attemptId = randomUUID();
    const totalQuestions = questions.length;

    db.prepare(
      'INSERT INTO quiz_attempts (id, quiz_id, user_id, total_questions) VALUES (?, ?, ?, ?)'
    ).run(attemptId, quizId, userId, totalQuestions);

    const shuffled = [...questions].sort(() => Math.random() - 0.5);

    res.status(201).json({
      attempt_id: attemptId,
      quiz_id: quizId,
      timer_seconds: quiz.timer_seconds,
      total_questions: totalQuestions,
      question_ids: shuffled.map((q) => q.id),
    });
  } catch (err) {
    console.error('Start attempt:', err);
    res.status(500).json({ error: 'Failed to start attempt' });
  }
});

export default router;
