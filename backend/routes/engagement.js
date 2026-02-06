/**
 * Engagement API: summary, progress, badges, weaknesses, question hints, preferences, daily challenge, weekly quiz.
 */

import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import {
  getSummary,
  getUserBadges,
  getUserCertificates,
  getProgressBySubject,
  getWeaknesses,
  getReadiness,
  getLeaderboard,
  recordQuizComplete,
  recordExamSubmit,
} from '../services/engagement.js';

const router = Router();

// GET /api/engagement/summary — dashboard: streak, xp, level, badges count, progress, recent activity
router.get('/summary', requireAuth, (req, res) => {
  try {
    const summary = getSummary(req.user.id);
    res.json(summary);
  } catch (err) {
    console.error('Engagement summary:', err);
    res.status(500).json({ error: 'Failed to load summary' });
  }
});

// GET /api/engagement/progress — progress by subject (for progress bars)
router.get('/progress', requireAuth, (req, res) => {
  try {
    const progress = getProgressBySubject(req.user.id);
    res.json(progress);
  } catch (err) {
    console.error('Engagement progress:', err);
    res.status(500).json({ error: 'Failed to load progress' });
  }
});

// GET /api/engagement/weaknesses — weak topics (last_score < 70% or few attempts)
router.get('/weaknesses', requireAuth, (req, res) => {
  try {
    const weaknesses = getWeaknesses(req.user.id);
    res.json(weaknesses);
  } catch (err) {
    console.error('Engagement weaknesses:', err);
    res.status(500).json({ error: 'Failed to load weaknesses' });
  }
});

// GET /api/engagement/badges — my badges
router.get('/badges', requireAuth, (req, res) => {
  try {
    const badges = getUserBadges(req.user.id);
    res.json(badges);
  } catch (err) {
    console.error('Engagement badges:', err);
    res.status(500).json({ error: 'Failed to load badges' });
  }
});

// GET /api/engagement/certificates — my certificates
router.get('/certificates', requireAuth, (req, res) => {
  try {
    const certs = getUserCertificates(req.user.id);
    res.json(certs);
  } catch (err) {
    console.error('Engagement certificates:', err);
    res.status(500).json({ error: 'Failed to load certificates' });
  }
});

// GET /api/engagement/readiness — readiness score for dashboard ("You are X% ready for Grade Y assessment")
router.get('/readiness', requireAuth, (req, res) => {
  try {
    const readiness = getReadiness(req.user.id);
    res.json(readiness);
  } catch (err) {
    console.error('Engagement readiness:', err);
    res.status(500).json({ error: 'Failed to load readiness' });
  }
});

// GET /api/engagement/leaderboard — top learners by XP (?scope=global&limit=10)
router.get('/leaderboard', requireAuth, (req, res) => {
  try {
    const scope = req.query.scope === 'class' ? 'class' : 'global';
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 10);
    const list = getLeaderboard(scope, limit);
    res.json(list);
  } catch (err) {
    console.error('Engagement leaderboard:', err);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

// GET /api/engagement/daily-challenge — today's challenge (quiz linked to daily_challenges for date_active = today)
router.get('/daily-challenge', requireAuth, (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const challenge = db
      .prepare(
        `SELECT dc.id, dc.title, dc.quiz_id, dc.subject_id, dc.grade_id, dc.date_active,
                s.name AS subject_name, g.name AS grade_name
         FROM daily_challenges dc
         JOIN subjects s ON dc.subject_id = s.id
         JOIN grades g ON dc.grade_id = g.id
         WHERE dc.date_active = ?`
      )
      .get(today);

    if (!challenge) {
      return res.json({ challenge: null, attempted: null });
    }

    const attempted = db
      .prepare('SELECT id, score, total_questions, completed_at FROM daily_attempts WHERE user_id = ? AND challenge_id = ?')
      .get(req.user.id, challenge.id);

    res.json({
      challenge: { ...challenge, quiz_id: challenge.quiz_id },
      attempted: attempted ? { score: attempted.score, total: attempted.total_questions, completed_at: attempted.completed_at } : null,
    });
  } catch (err) {
    console.error('Daily challenge:', err);
    res.status(500).json({ error: 'Failed to load daily challenge' });
  }
});

// POST /api/engagement/daily-attempt — record daily challenge attempt (call after completing the quiz)
router.post('/daily-attempt', requireAuth, (req, res) => {
  try {
    const { challenge_id, score, total_questions } = req.body;
    if (!challenge_id || score == null || !total_questions) {
      return res.status(400).json({ error: 'challenge_id, score, total_questions required' });
    }
    const existing = db.prepare('SELECT id FROM daily_attempts WHERE user_id = ? AND challenge_id = ?').get(req.user.id, challenge_id);
    if (existing) {
      return res.status(400).json({ error: 'Already attempted today\'s challenge' });
    }
    const id = randomUUID();
    db.prepare(
      'INSERT INTO daily_attempts (id, user_id, challenge_id, score, total_questions, completed_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))'
    ).run(id, req.user.id, challenge_id, score, total_questions);
    res.status(201).json({ id });
  } catch (err) {
    console.error('Daily attempt:', err);
    res.status(500).json({ error: 'Failed to record attempt' });
  }
});

// GET /api/engagement/weekly-quiz — current week's quiz
router.get('/weekly-quiz', requireAuth, (req, res) => {
  try {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(( (now - startOfYear) / 86400000 + startOfYear.getDay() + 1 ) / 7);
    const year = now.getFullYear();

    const quiz = db
      .prepare(
        `SELECT wq.id, wq.title, wq.quiz_id, wq.week_number, wq.year,
                s.name AS subject_name, g.name AS grade_name
         FROM weekly_quizzes wq
         JOIN subjects s ON wq.subject_id = s.id
         JOIN grades g ON wq.grade_id = g.id
         WHERE wq.week_number = ? AND wq.year = ?`
      )
      .get(weekNumber, year);

    if (!quiz) {
      return res.json({ quiz: null, my_attempt: null, leaderboard: [] });
    }

    const myAttempt = db
      .prepare('SELECT score, total_questions, rank, completed_at FROM weekly_attempts WHERE user_id = ? AND weekly_quiz_id = ?')
      .get(req.user.id, quiz.id);

    const leaderboard = db
      .prepare(
        `SELECT u.full_name, wa.score, wa.total_questions, wa.rank, wa.completed_at
         FROM weekly_attempts wa
         JOIN users u ON wa.user_id = u.id
         WHERE wa.weekly_quiz_id = ?
         ORDER BY wa.score DESC, wa.completed_at ASC
         LIMIT 10`
      )
      .all(quiz.id);

    res.json({ quiz, my_attempt: myAttempt, leaderboard });
  } catch (err) {
    console.error('Weekly quiz:', err);
    res.status(500).json({ error: 'Failed to load weekly quiz' });
  }
});

// POST /api/engagement/record-quiz-complete — called by backend when quiz attempt is completed (internal or from client to sync)
router.post('/record-quiz-complete', requireAuth, (req, res) => {
  try {
    const { quiz_id, score, total } = req.body;
    if (!quiz_id || score == null || total == null) {
      return res.status(400).json({ error: 'quiz_id, score, total required' });
    }
    recordQuizComplete(req.user.id, { quiz_id, score, total });
    res.json({ ok: true });
  } catch (err) {
    console.error('Record quiz complete:', err);
    res.status(500).json({ error: 'Failed to record' });
  }
});

// GET /api/engagement/question-hints — step-by-step hints for a question (quiz_question or question_bank id)
router.get('/question-hints', (req, res) => {
  try {
    const { question_entity_type, question_entity_id } = req.query;
    if (!question_entity_type || !question_entity_id) {
      return res.status(400).json({ error: 'question_entity_type and question_entity_id required' });
    }
    const rows = db
      .prepare(
        'SELECT id, step_order, step_type, content_text, content_html, video_url FROM question_hints WHERE question_entity_type = ? AND question_entity_id = ? ORDER BY step_order'
      )
      .all(question_entity_type, question_entity_id);
    res.json(rows);
  } catch (err) {
    console.error('Question hints:', err);
    res.status(500).json({ error: 'Failed to load hints' });
  }
});

// GET /api/engagement/preferences — user preferences (theme, font_size, etc.)
router.get('/preferences', requireAuth, (req, res) => {
  try {
    const row = db.prepare('SELECT font_size, theme, text_to_speech, low_data_mode FROM user_preferences WHERE user_id = ?').get(req.user.id);
    res.json(row || { font_size: 'medium', theme: 'light', text_to_speech: 0, low_data_mode: 0 });
  } catch (err) {
    console.error('Preferences:', err);
    res.status(500).json({ error: 'Failed to load preferences' });
  }
});

// PATCH /api/engagement/preferences — update preferences
router.patch('/preferences', requireAuth, (req, res) => {
  try {
    const { font_size, theme, text_to_speech, low_data_mode } = req.body;
    const userId = req.user.id;
    const existing = db.prepare('SELECT user_id FROM user_preferences WHERE user_id = ?').get(userId);
    const updates = [];
    const values = [];
    if (font_size !== undefined) { updates.push('font_size = ?'); values.push(['small', 'medium', 'large'].includes(font_size) ? font_size : 'medium'); }
    if (theme !== undefined) { updates.push('theme = ?'); values.push(['light', 'dark', 'system'].includes(theme) ? theme : 'light'); }
    if (text_to_speech !== undefined) { updates.push('text_to_speech = ?'); values.push(text_to_speech ? 1 : 0); }
    if (low_data_mode !== undefined) { updates.push('low_data_mode = ?'); values.push(low_data_mode ? 1 : 0); }
    if (updates.length === 0) return res.json({ ok: true });
    values.push(userId);
    if (existing) {
      db.prepare(`UPDATE user_preferences SET ${updates.join(', ')}, updated_at = datetime('now') WHERE user_id = ?`).run(...values);
    } else {
      db.prepare(
        `INSERT INTO user_preferences (user_id, font_size, theme, text_to_speech, low_data_mode, updated_at) VALUES (?, 'medium', 'light', 0, 0)`
      ).run(userId);
      db.prepare(`UPDATE user_preferences SET ${updates.join(', ')}, updated_at = datetime('now') WHERE user_id = ?`).run(...values);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Update preferences:', err);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

export default router;
