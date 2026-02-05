/**
 * Engagement engine: progress, streaks, XP, badges, daily/weekly.
 * Call recordActivity() when student completes a quiz or submits an exam.
 */

import { randomUUID } from 'crypto';
import db from '../db/index.js';

const XP_QUIZ_BASE = 10;
const XP_QUIZ_BONUS = 20;
const XP_EXAM_SUBMIT = 15;
const XP_EXAM_MARKED_BONUS = 25;
const LEVEL_XP_BASE = 50; // level = floor(sqrt(total_xp / 50)) + 1, cap 20

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function parseCriteria(criteriaJson) {
  if (!criteriaJson) return null;
  try {
    return typeof criteriaJson === 'string' ? JSON.parse(criteriaJson) : criteriaJson;
  } catch {
    return null;
  }
}

/** Ensure user has a row in user_streaks and user_xp */
function ensureUserEngagement(userId) {
  db.prepare('INSERT OR IGNORE INTO user_streaks (user_id, current_streak, longest_streak) VALUES (?, 0, 0)').run(userId);
  db.prepare('INSERT OR IGNORE INTO user_xp (user_id, total_xp, level) VALUES (?, 0, 1)').run(userId);
}

/** Update streak: +1 if last activity was yesterday, reset if older, no change if today */
function updateStreak(userId) {
  ensureUserEngagement(userId);
  const today = todayDate();
  const row = db.prepare('SELECT last_activity_date, current_streak, longest_streak FROM user_streaks WHERE user_id = ?').get(userId);
  if (!row) return;

  const last = row.last_activity_date || '';
  let newStreak = row.current_streak;
  if (last === today) return; // already counted today
  if (last) {
    const lastDate = new Date(last);
    const todayObj = new Date(today);
    const diffDays = Math.round((todayObj - lastDate) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) newStreak += 1;
    else newStreak = 1;
  } else {
    newStreak = 1;
  }

  const longest = Math.max(row.longest_streak, newStreak);
  db.prepare(
    'UPDATE user_streaks SET current_streak = ?, longest_streak = ?, last_activity_date = ? WHERE user_id = ?'
  ).run(newStreak, longest, today, userId);
}

/** Add XP and recalc level (cap 20) */
function addXP(userId, xp) {
  ensureUserEngagement(userId);
  db.prepare('UPDATE user_xp SET total_xp = total_xp + ?, updated_at = datetime(\'now\') WHERE user_id = ?').run(xp, userId);
  const row = db.prepare('SELECT total_xp FROM user_xp WHERE user_id = ?').get(userId);
  const level = Math.min(20, Math.floor(Math.sqrt((row?.total_xp || 0) / LEVEL_XP_BASE)) + 1);
  db.prepare('UPDATE user_xp SET level = ? WHERE user_id = ?').run(level, userId);
}

/** Record progress (quiz or written_exam completed) */
function recordProgress(userId, entityType, entityId) {
  const id = randomUUID();
  db.prepare(
    'INSERT OR IGNORE INTO user_progress (id, user_id, entity_type, entity_id, completed, completed_at) VALUES (?, ?, ?, ?, 1, datetime(\'now\'))'
  ).run(id, userId, entityType, entityId);
}

/** Check badge criteria and award if met (idempotent: won't double-award) */
function checkAndAwardBadges(userId, context = {}) {
  const badges = db.prepare('SELECT id, name, criteria_json, xp_reward FROM badges').all();
  const existing = new Set(
    db.prepare('SELECT badge_id FROM user_badges WHERE user_id = ?').all(userId).map((r) => r.badge_id)
  );

  for (const badge of badges) {
    if (existing.has(badge.id)) continue;
    const criteria = parseCriteria(badge.criteria_json);
    if (!criteria) continue;

    let award = false;
    if (criteria.type === 'first_quiz') {
      const count = db.prepare('SELECT COUNT(*) AS n FROM user_progress WHERE user_id = ? AND entity_type = ?').get(userId, 'quiz').n;
      award = count >= 1;
    } else if (criteria.type === 'quiz_streak' && criteria.days) {
      const row = db.prepare('SELECT current_streak FROM user_streaks WHERE user_id = ?').get(userId);
      award = (row?.current_streak || 0) >= criteria.days;
    } else if (criteria.type === 'score_90' && context.score != null && context.total != null) {
      const pct = context.total > 0 ? (context.score / context.total) * 100 : 0;
      award = pct >= 90;
    } else if (criteria.type === 'quizzes_10') {
      const count = db.prepare('SELECT COUNT(*) AS n FROM user_progress WHERE user_id = ? AND entity_type = ?').get(userId, 'quiz').n;
      award = count >= (criteria.count || 10);
    } else if (criteria.type === 'first_exam') {
      const count = db.prepare('SELECT COUNT(*) AS n FROM user_progress WHERE user_id = ? AND entity_type = ?').get(userId, 'written_exam').n;
      award = count >= 1;
    }

    if (award) {
      db.prepare('INSERT INTO user_badges (id, user_id, badge_id, awarded_at) VALUES (?, ?, ?, datetime(\'now\'))').run(
        randomUUID(),
        userId,
        badge.id
      );
      addXP(userId, badge.xp_reward || 0);
    }
  }
}

/**
 * Call when student completes a quiz attempt.
 * @param {string} userId
 * @param {{ quiz_id: string, score: number, total: number }} data
 */
export function recordQuizComplete(userId, data) {
  const { quiz_id, score = 0, total = 1 } = data;
  ensureUserEngagement(userId);
  updateStreak(userId);
  const xp = XP_QUIZ_BASE + Math.floor((score / total) * XP_QUIZ_BONUS);
  addXP(userId, xp);
  recordProgress(userId, 'quiz', quiz_id);
  checkAndAwardBadges(userId, { score, total });
}

/**
 * Call when student submits a written exam (streak, base XP, progress).
 * @param {string} userId
 * @param {{ exam_id: string }} data
 */
export function recordExamSubmit(userId, data) {
  const { exam_id } = data;
  ensureUserEngagement(userId);
  updateStreak(userId);
  addXP(userId, XP_EXAM_SUBMIT);
  recordProgress(userId, 'written_exam', exam_id);
}

/**
 * Call when teacher marks an exam (bonus XP and badge check).
 * @param {string} userId - student who took the exam
 * @param {{ score: number, total: number }} data
 */
export function recordExamMarked(userId, data) {
  const { score = 0, total = 1 } = data;
  ensureUserEngagement(userId);
  const xp = Math.floor((score / total) * XP_EXAM_MARKED_BONUS);
  addXP(userId, xp);
  checkAndAwardBadges(userId, { score, total });
}

/**
 * Get engagement summary for dashboard: streak, xp, level, badges count, progress stats, recent activity.
 */
export function getSummary(userId) {
  ensureUserEngagement(userId);
  const streak = db.prepare('SELECT current_streak, longest_streak, last_activity_date FROM user_streaks WHERE user_id = ?').get(userId);
  const xpRow = db.prepare('SELECT total_xp, level FROM user_xp WHERE user_id = ?').get(userId);
  const badgeCount = db.prepare('SELECT COUNT(*) AS n FROM user_badges WHERE user_id = ?').get(userId).n;
  const quizCompleted = db.prepare('SELECT COUNT(*) AS n FROM user_progress WHERE user_id = ? AND entity_type = ?').get(userId, 'quiz').n;
  const examCompleted = db.prepare('SELECT COUNT(*) AS n FROM user_progress WHERE user_id = ? AND entity_type = ?').get(userId, 'written_exam').n;

  // Progress by subject+grade: total quizzes+exams available vs completed
  const totalQuizzes = db.prepare('SELECT COUNT(*) AS n FROM quizzes').get().n;
  const totalExams = db.prepare('SELECT COUNT(*) AS n FROM written_exams').get().n;
  const totalActivities = totalQuizzes + totalExams;
  const completedActivities = quizCompleted + examCompleted;
  const progressPercent = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

  // Recent activity: last 10 progress entries with labels
  const recent = db
    .prepare(
      `SELECT p.entity_type, p.entity_id, p.completed_at,
              q.title AS quiz_title, s.name AS subject_name
       FROM user_progress p
       LEFT JOIN quizzes q ON p.entity_type = 'quiz' AND p.entity_id = q.id
       LEFT JOIN subjects s ON q.subject_id = s.id
       WHERE p.user_id = ? AND p.entity_type = 'quiz'
       ORDER BY p.completed_at DESC LIMIT 5`
    )
    .all(userId);

  const recentExams = db
    .prepare(
      `SELECT p.entity_type, p.entity_id, p.completed_at,
              e.title AS exam_title, s.name AS subject_name
       FROM user_progress p
       LEFT JOIN written_exams e ON p.entity_type = 'written_exam' AND p.entity_id = e.id
       LEFT JOIN subjects s ON e.subject_id = s.id
       WHERE p.user_id = ? AND p.entity_type = 'written_exam'
       ORDER BY p.completed_at DESC LIMIT 5`
    )
    .all(userId);

  const recentActivity = [
    ...recent.map((r) => ({ type: 'quiz', title: r.quiz_title, subject_name: r.subject_name, completed_at: r.completed_at })),
    ...recentExams.map((r) => ({ type: 'exam', title: r.exam_title, subject_name: r.subject_name, completed_at: r.completed_at })),
  ]
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
    .slice(0, 10);

  return {
    streak: {
      current: streak?.current_streak ?? 0,
      longest: streak?.longest_streak ?? 0,
      last_activity_date: streak?.last_activity_date ?? null,
    },
    xp: xpRow?.total_xp ?? 0,
    level: xpRow?.level ?? 1,
    badges_count: badgeCount,
    progress: {
      quizzes_completed: quizCompleted,
      exams_completed: examCompleted,
      total_activities: totalActivities,
      progress_percent: progressPercent,
    },
    recent_activity: recentActivity,
  };
}

/** Get user's badges with badge details */
export function getUserBadges(userId) {
  const rows = db
    .prepare(
      `SELECT b.id, b.name, b.description, b.icon, ub.awarded_at
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = ?
       ORDER BY ub.awarded_at DESC`
    )
    .all(userId);
  return rows;
}

/** Get user's certificates */
export function getUserCertificates(userId) {
  const rows = db
    .prepare(
      `SELECT c.id, c.title, c.score, c.issued_at, c.verify_code,
              s.name AS subject_name, g.name AS grade_name
       FROM certificates c
       JOIN subjects s ON c.subject_id = s.id
       JOIN grades g ON c.grade_id = g.id
       WHERE c.user_id = ?
       ORDER BY c.issued_at DESC`
    )
    .all(userId);
  return rows;
}

/** Get progress by subject (for progress bars per subject) */
export function getProgressBySubject(userId) {
  const quizProgress = db
    .prepare(
      `SELECT q.subject_id, s.name AS subject_name, COUNT(DISTINCT p.entity_id) AS completed
       FROM user_progress p
       JOIN quizzes q ON p.entity_type = 'quiz' AND p.entity_id = q.id
       JOIN subjects s ON q.subject_id = s.id
       WHERE p.user_id = ?
       GROUP BY q.subject_id`
    )
    .all(userId);

  const quizTotals = db.prepare('SELECT subject_id, COUNT(*) AS total FROM quizzes GROUP BY subject_id').all();
  const examTotals = db.prepare('SELECT subject_id, COUNT(*) AS total FROM written_exams GROUP BY subject_id').all();
  const bySubject = {};
  for (const row of quizTotals) bySubject[row.subject_id] = (bySubject[row.subject_id] || 0) + row.total;
  for (const row of examTotals) bySubject[row.subject_id] = (bySubject[row.subject_id] || 0) + row.total;

  return quizProgress.map((r) => ({
    subject_id: r.subject_id,
    subject_name: r.subject_name,
    completed: r.completed,
    total: bySubject[r.subject_id] || 0,
    percent: bySubject[r.subject_id] ? Math.round((r.completed / bySubject[r.subject_id]) * 100) : 0,
  }));
}
