/**
 * SQLite schema for CBC Learning Platform.
 * Includes: users, subjects, grades, quiz (Jiggle Your Mind), written exams (Sitting Exam).
 */

export function runSchema(db) {
  db.exec(`
    -- Users (auth)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      user_type TEXT NOT NULL CHECK (user_type IN ('student', 'teacher', 'parent', 'admin')),
      avatar_url TEXT,
      phone_number TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    -- Subjects (e.g. Mathematics, English, Science)
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Grades (e.g. Grade 4, Grade 5)
    CREATE TABLE IF NOT EXISTS grades (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ========== JIGGLE YOUR MIND (Quizzes) ==========
    -- Quiz: practice quiz with MCQ / true-false, instant feedback, timer per question
    -- exam_mode: topic_quiz | end_of_strand | end_of_term | mock_national | timed_drill | remedial | challenge
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      grade_id TEXT NOT NULL REFERENCES grades(id),
      strand_id TEXT REFERENCES strands(id),
      difficulty TEXT NOT NULL CHECK (difficulty IN ('basic', 'intermediate', 'advanced')),
      exam_mode TEXT NOT NULL DEFAULT 'topic_quiz',
      timer_seconds INTEGER NOT NULL DEFAULT 60,
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_quizzes_subject_grade ON quizzes(subject_id, grade_id);

    -- Quiz questions (multiple_choice, true_false)
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      explanation TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);

    -- Quiz options (choices for MCQ; true/false for boolean)
    CREATE TABLE IF NOT EXISTS quiz_options (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
      option_text TEXT NOT NULL,
      is_correct INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_quiz_options_question ON quiz_options(question_id);

    -- Quiz attempts (one per student per quiz per try)
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL REFERENCES quizzes(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      score INTEGER,
      total_questions INTEGER NOT NULL,
      time_taken_seconds INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_user ON quiz_attempts(quiz_id, user_id);

    -- Per-question answers in an attempt (for instant feedback and scoring)
    CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
      id TEXT PRIMARY KEY,
      attempt_id TEXT NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL REFERENCES quiz_questions(id),
      option_id TEXT REFERENCES quiz_options(id),
      is_correct INTEGER NOT NULL DEFAULT 0,
      answered_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_quiz_attempt_answers_attempt ON quiz_attempt_answers(attempt_id);

    -- ========== SITTING EXAM (Written exams) ==========
    -- Written exam: formal, timed, typed answers, one attempt (configurable), teacher marking
    -- exam_mode: topic_quiz | end_of_strand | end_of_term | mock_national | timed_drill | remedial | challenge
    CREATE TABLE IF NOT EXISTS written_exams (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      grade_id TEXT NOT NULL REFERENCES grades(id),
      strand_id TEXT REFERENCES strands(id),
      duration_minutes INTEGER NOT NULL,
      one_attempt_only INTEGER NOT NULL DEFAULT 1,
      exam_mode TEXT NOT NULL DEFAULT 'end_of_term',
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_written_exams_subject_grade ON written_exams(subject_id, grade_id);

    -- Written exam questions (open-ended, order fixed)
    CREATE TABLE IF NOT EXISTS written_questions (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL REFERENCES written_exams(id) ON DELETE CASCADE,
      question_text TEXT NOT NULL,
      max_marks INTEGER NOT NULL DEFAULT 10,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_written_questions_exam ON written_questions(exam_id);

    -- Written submissions (one per student per exam, or per attempt if one_attempt_only=0)
    CREATE TABLE IF NOT EXISTS written_submissions (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL REFERENCES written_exams(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      submitted_at TEXT,
      status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'marked')),
      time_taken_seconds INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_written_submissions_exam_user ON written_submissions(exam_id, user_id);

    -- Written submission answers (typed, autosaved)
    CREATE TABLE IF NOT EXISTS written_submission_answers (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL REFERENCES written_submissions(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL REFERENCES written_questions(id),
      answer_text TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_written_sub_answers_sub_q ON written_submission_answers(submission_id, question_id);

    -- Marks/reviews: teacher score and comment per question (or overall)
    CREATE TABLE IF NOT EXISTS marks_reviews (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL REFERENCES written_submissions(id) ON DELETE CASCADE,
      question_id TEXT REFERENCES written_questions(id),
      marks_awarded INTEGER NOT NULL DEFAULT 0,
      max_marks INTEGER NOT NULL,
      comment TEXT,
      marked_by TEXT REFERENCES users(id),
      marked_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_marks_reviews_submission ON marks_reviews(submission_id);

    -- ========== CBC CONTENT STRUCTURE (Grade → Subject → Strand → Sub-Strand) ==========
    -- Strands (e.g. Numbers, Algebra) per subject/grade
    CREATE TABLE IF NOT EXISTS strands (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      grade_id TEXT NOT NULL REFERENCES grades(id),
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_strands_subject_grade ON strands(subject_id, grade_id);

    -- Sub-strands (e.g. Fractions, Decimals) per strand
    CREATE TABLE IF NOT EXISTS sub_strands (
      id TEXT PRIMARY KEY,
      strand_id TEXT NOT NULL REFERENCES strands(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_sub_strands_strand ON sub_strands(strand_id);

    -- ========== LIBRARY RESOURCES (Books: textbook, workbook, teacher_guide, etc.) ==========
    CREATE TABLE IF NOT EXISTS library_resources (
      id TEXT PRIMARY KEY,
      grade_id TEXT NOT NULL REFERENCES grades(id),
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      strand_id TEXT REFERENCES strands(id),
      sub_strand_id TEXT REFERENCES sub_strands(id),
      resource_type TEXT NOT NULL CHECK (resource_type IN (
        'textbook', 'teacher_guide', 'workbook', 'revision_notes', 'summary_sheet',
        'past_paper', 'reader', 'interactive', 'activity_book'
      )),
      title TEXT NOT NULL,
      description TEXT,
      file_path TEXT,
      file_type TEXT,
      cover_url TEXT,
      toc_json TEXT,
      chapters_json TEXT,
      tags TEXT,
      author TEXT,
      publisher TEXT,
      page_count INTEGER,
      marking_scheme_url TEXT,
      examiner_notes TEXT,
      created_by TEXT REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
      view_count INTEGER NOT NULL DEFAULT 0,
      download_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_library_resources_grade_subject ON library_resources(grade_id, subject_id);
    CREATE INDEX IF NOT EXISTS idx_library_resources_type ON library_resources(resource_type);
    CREATE INDEX IF NOT EXISTS idx_library_resources_status ON library_resources(status);

    -- Resource usage (for "most used", analytics)
    CREATE TABLE IF NOT EXISTS resource_usage (
      id TEXT PRIMARY KEY,
      resource_id TEXT NOT NULL REFERENCES library_resources(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id),
      action TEXT NOT NULL CHECK (action IN ('view', 'download')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_resource_usage_resource ON resource_usage(resource_id);

    -- ========== MASTER QUESTION BANK (for exam generator) ==========
    CREATE TABLE IF NOT EXISTS question_bank (
      id TEXT PRIMARY KEY,
      grade_id TEXT NOT NULL REFERENCES grades(id),
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      strand_id TEXT REFERENCES strands(id),
      sub_strand_id TEXT REFERENCES sub_strands(id),
      difficulty TEXT NOT NULL CHECK (difficulty IN ('basic', 'intermediate', 'advanced')),
      skill_tested TEXT,
      question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
      question_text TEXT NOT NULL,
      options_json TEXT,
      correct_option_id TEXT,
      explanation TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_question_bank_grade_subject ON question_bank(grade_id, subject_id);
    CREATE INDEX IF NOT EXISTS idx_question_bank_difficulty ON question_bank(difficulty);

    -- ========== ENGAGEMENT: Progress, Badges, Certificates, Streaks, XP, Daily/Weekly ==========
    -- Progress: completed quizzes, exams (entity_type = quiz | written_exam, entity_id = quiz_id or exam_id)
    CREATE TABLE IF NOT EXISTS user_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      entity_type TEXT NOT NULL CHECK (entity_type IN ('quiz', 'written_exam', 'resource')),
      entity_id TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 1,
      completed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_user_progress_user_entity ON user_progress(user_id, entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);

    -- Badges (trigger rules in criteria_json: first_lesson, quiz_streak_7, score_90, topics_10, etc.)
    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      criteria_json TEXT,
      xp_reward INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- User earned badges
    CREATE TABLE IF NOT EXISTS user_badges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      badge_id TEXT NOT NULL REFERENCES badges(id),
      awarded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_user_badges_user_badge ON user_badges(user_id, badge_id);
    CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

    -- Certificates (course = subject + grade; verify_code for QR/lookup)
    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      grade_id TEXT NOT NULL REFERENCES grades(id),
      title TEXT NOT NULL,
      score INTEGER,
      issued_at TEXT NOT NULL DEFAULT (datetime('now')),
      verify_code TEXT UNIQUE NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);

    -- Streaks: one row per user
    CREATE TABLE IF NOT EXISTS user_streaks (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      last_activity_date TEXT
    );

    -- XP and level: one row per user (level from XP: e.g. level = floor(sqrt(xp/50)) + 1)
    CREATE TABLE IF NOT EXISTS user_xp (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      total_xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Daily challenge: one active per day (links to quiz_id or question_set)
    CREATE TABLE IF NOT EXISTS daily_challenges (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      grade_id TEXT NOT NULL REFERENCES grades(id),
      quiz_id TEXT REFERENCES quizzes(id),
      title TEXT NOT NULL,
      date_active TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(date_active);

    -- Daily attempt: one per user per challenge
    CREATE TABLE IF NOT EXISTS daily_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      challenge_id TEXT NOT NULL REFERENCES daily_challenges(id),
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      completed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_attempts_user_challenge ON daily_attempts(user_id, challenge_id);

    -- Weekly quiz: one per week
    CREATE TABLE IF NOT EXISTS weekly_quizzes (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      grade_id TEXT NOT NULL REFERENCES grades(id),
      quiz_id TEXT NOT NULL REFERENCES quizzes(id),
      title TEXT NOT NULL,
      week_number INTEGER NOT NULL,
      year INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_weekly_quizzes_week_year ON weekly_quizzes(week_number, year);

    -- Weekly attempt: score and rank for leaderboard
    CREATE TABLE IF NOT EXISTS weekly_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      weekly_quiz_id TEXT NOT NULL REFERENCES weekly_quizzes(id),
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      rank INTEGER,
      completed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_weekly_attempts_quiz ON weekly_attempts(weekly_quiz_id);
  `);

  // Migration: add new columns to existing tables (no-op if already present)
  const migrations = [
    "ALTER TABLE quizzes ADD COLUMN exam_mode TEXT NOT NULL DEFAULT 'topic_quiz'",
    "ALTER TABLE quizzes ADD COLUMN strand_id TEXT REFERENCES strands(id)",
    "ALTER TABLE written_exams ADD COLUMN exam_mode TEXT NOT NULL DEFAULT 'end_of_term'",
    "ALTER TABLE written_exams ADD COLUMN strand_id TEXT REFERENCES strands(id)",
    "ALTER TABLE library_resources ADD COLUMN marking_scheme_url TEXT",
    "ALTER TABLE library_resources ADD COLUMN examiner_notes TEXT",
  ];
  for (const sql of migrations) {
    try {
      db.exec(sql);
    } catch (_) {
      // Column or table already has it
    }
  }
}
