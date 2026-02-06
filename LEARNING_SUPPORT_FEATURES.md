# 🧠 Learning Support Features — Platform Design & Build Plan

This document maps learner-support features into a **feature map**, **database schema**, and **phased build plan** for the CBC platform.

---

## 📋 Feature Map (by module)

| Module | Features | Priority | Depends on |
|--------|----------|----------|------------|
| **Multi-format lessons** | Text, audio, video, diagrams, interactive; format switcher | P1 | Library, strands |
| **Smart notes** | Highlight, personal notes, bookmarks, formulas, export PDF | P1 | Lessons / resources |
| **Step-by-step solutions** | Hint 1, hint 2, full solution, explanation video (per question) | P1 | Question bank, quizzes |
| **Adaptive difficulty** | Adjust question difficulty from performance (score → harder/easier) | P1 | Question bank, quiz attempts |
| **Weakness tracker** | Weak topics, avg scores, trend, recommended practice | P1 | Progress, attempts |
| **Study timer** | Pomodoro: 25 min study, 5 min break, session counter | P2 | — |
| **Study planner** | Goals, schedule subjects, reminders, daily targets | P2 | Calendar, notifications |
| **Flashcards** | Auto-generated, spaced repetition, shuffle, self-test | P2 | Question bank / content |
| **Memory boost** | Quick recall, fill-in-blank, rapid-fire | P2 | Question bank |
| **Formula vault** | Formulas, rules, definitions; searchable, printable | P2 | Library, sub-strands |
| **Ask-a-question** | Per lesson/topic: ask, teacher answer, view Q&A | P2 | Lessons, users |
| **Mistake review** | Store wrong answers, retry, explanation review | P2 | Quiz attempts |
| **Progress reports** | Weekly report, topic mastery, time spent, trends (student + parent) | P2 | Progress, attempts |
| **Learning path** | Post-diagnostic: topic order, practice plan, revision schedule | P3 | Diagnostic, strands |
| **Discussion boards** | Per topic: threads, moderated | P3 | Topics, users |
| **Exam simulator** | Timed, locked nav, flagging, review screen, marking | P3 | Written exams |
| **Learning games** | Math puzzles, word games, matching, logic | P3 | Question bank |
| **Experiment mode** | Virtual labs, simulations (science) | P3 | Content, strands |
| **Live help** | Scheduled sessions, doubt clinics (optional) | P4 | Calendar, video |
| **Accessibility** | TTS, font size, dark mode, low-data, offline | P1–P2 | UI, settings |

---

## 🗄 Database Schema Additions

Run these after the existing schema. Tables are additive.

### Lessons (multi-format content)

```sql
-- Lessons: one per topic/sub_strand (or per resource chapter)
CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  grade_id TEXT NOT NULL REFERENCES grades(id),
  subject_id TEXT NOT NULL REFERENCES subjects(id),
  strand_id TEXT REFERENCES strands(id),
  sub_strand_id TEXT REFERENCES sub_strands(id),
  title TEXT NOT NULL,
  slug TEXT,
  content_text TEXT,
  content_html TEXT,
  audio_url TEXT,
  video_url TEXT,
  diagram_url TEXT,
  interactive_json TEXT,
  duration_minutes INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_lessons_grade_subject ON lessons(grade_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_lessons_sub_strand ON lessons(sub_strand_id);

-- Lesson progress (completed, time spent)
CREATE TABLE IF NOT EXISTS lesson_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  lesson_id TEXT NOT NULL REFERENCES lessons(id),
  completed INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  last_position_seconds INTEGER,
  completed_at TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, lesson_id)
);
```

### Smart notes & bookmarks

```sql
-- Highlights and notes (on lesson or resource)
CREATE TABLE IF NOT EXISTS user_highlights (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lesson', 'library_resource')),
  entity_id TEXT NOT NULL,
  anchor_start TEXT,
  anchor_end TEXT,
  selected_text TEXT,
  note_text TEXT,
  color TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_highlights_user_entity ON user_highlights(user_id, entity_type, entity_id);

-- Bookmarks (topic / lesson / question)
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lesson', 'library_resource', 'quiz_question', 'strand')),
  entity_id TEXT NOT NULL,
  label TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, entity_type, entity_id)
);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON user_bookmarks(user_id);

-- Saved formulas / key facts (user or system)
CREATE TABLE IF NOT EXISTS formula_vault (
  id TEXT PRIMARY KEY,
  grade_id TEXT REFERENCES grades(id),
  subject_id TEXT REFERENCES subjects(id),
  strand_id TEXT REFERENCES strands(id),
  title TEXT NOT NULL,
  content_text TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('formula', 'definition', 'rule', 'fact')),
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_formula_vault_subject ON formula_vault(subject_id);
```

### Step-by-step solutions (hints per question)

```sql
-- Hints and solution steps for questions (quiz_questions or question_bank)
CREATE TABLE IF NOT EXISTS question_hints (
  id TEXT PRIMARY KEY,
  question_entity_type TEXT NOT NULL CHECK (question_entity_type IN ('quiz_question', 'question_bank')),
  question_entity_id TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  step_type TEXT NOT NULL CHECK (step_type IN ('hint', 'full_solution', 'explanation_video')),
  content_text TEXT,
  content_html TEXT,
  video_url TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_question_hints_question ON question_hints(question_entity_type, question_entity_id);
```

### Weakness tracker (derived + recommendations)

```sql
-- Per-user per strand/sub_strand: attempts, correct count, last score (for weakness calc)
CREATE TABLE IF NOT EXISTS user_topic_performance (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  subject_id TEXT NOT NULL REFERENCES subjects(id),
  strand_id TEXT REFERENCES strands(id),
  sub_strand_id TEXT REFERENCES sub_strands(id),
  attempts_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  last_score_percent INTEGER,
  last_activity_at TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, subject_id, strand_id, sub_strand_id)
);
CREATE INDEX IF NOT EXISTS idx_topic_perf_user ON user_topic_performance(user_id);

-- Recommended practice sets (generated or manual)
CREATE TABLE IF NOT EXISTS practice_recommendations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  subject_id TEXT NOT NULL REFERENCES subjects(id),
  strand_id TEXT REFERENCES strands(id),
  reason TEXT NOT NULL CHECK (reason IN ('weak_topic', 'revision', 'next_in_path')),
  priority INTEGER DEFAULT 0,
  quiz_ids_json TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_practice_rec_user ON practice_recommendations(user_id);
```

### Study timer & planner

```sql
-- Pomodoro / study sessions (log only; timer is client-side)
CREATE TABLE IF NOT EXISTS study_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  started_at TEXT NOT NULL,
  ended_at TEXT,
  duration_seconds INTEGER,
  session_type TEXT NOT NULL CHECK (session_type IN ('focus', 'break')),
  subject_id TEXT REFERENCES subjects(id),
  goal_text TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id);

-- Study goals and schedule
CREATE TABLE IF NOT EXISTS study_goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('minutes_per_day', 'quizzes_per_week', 'topics_per_week')),
  target_value INTEGER NOT NULL,
  subject_id TEXT REFERENCES subjects(id),
  reminder_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_study_goals_user ON study_goals(user_id);

-- Daily schedule slots (optional)
CREATE TABLE IF NOT EXISTS study_schedule (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  subject_id TEXT REFERENCES subjects(id),
  label TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_study_schedule_user ON study_schedule(user_id);
```

### Flashcards & spaced repetition

```sql
-- Flashcard sets (per subject/strand or auto-generated)
CREATE TABLE IF NOT EXISTS flashcard_sets (
  id TEXT PRIMARY KEY,
  grade_id TEXT NOT NULL REFERENCES grades(id),
  subject_id TEXT NOT NULL REFERENCES subjects(id),
  strand_id TEXT REFERENCES strands(id),
  title TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('manual', 'auto_from_questions', 'auto_from_lessons')),
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS flashcards (
  id TEXT PRIMARY KEY,
  set_id TEXT NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  front_html TEXT,
  back_html TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_flashcards_set ON flashcards(set_id);

-- Spaced repetition: per user per card
CREATE TABLE IF NOT EXISTS flashcard_reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  flashcard_id TEXT NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  next_review_at TEXT NOT NULL,
  ease_factor REAL DEFAULT 2.5,
  interval_days INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  last_reviewed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, flashcard_id)
);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user ON flashcard_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_next ON flashcard_reviews(user_id, next_review_at);
```

### Mistake review (wrong answers)

```sql
-- Store wrong answers for retry and review
CREATE TABLE IF NOT EXISTS mistake_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  question_entity_type TEXT NOT NULL CHECK (question_entity_type IN ('quiz_question', 'question_bank')),
  question_entity_id TEXT NOT NULL,
  attempt_id TEXT,
  wrong_answer_text TEXT,
  correct_answer_text TEXT,
  explanation_shown INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  last_wrong_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_mistake_log_user ON mistake_log(user_id);
CREATE INDEX IF NOT EXISTS idx_mistake_log_question ON mistake_log(question_entity_type, question_entity_id);
```

### Ask-a-question & discussion

```sql
-- Questions from students (per lesson / topic)
CREATE TABLE IF NOT EXISTS student_questions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lesson', 'strand', 'sub_strand', 'quiz')),
  entity_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
  answered_at TEXT,
  answer_text TEXT,
  answered_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_student_questions_entity ON student_questions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_student_questions_user ON student_questions(user_id);

-- Discussion threads (per topic / strand)
CREATE TABLE IF NOT EXISTS discussion_threads (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('strand', 'sub_strand', 'lesson')),
  entity_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body_text TEXT NOT NULL,
  is_pinned INTEGER DEFAULT 0,
  is_locked INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS discussion_replies (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES discussion_threads(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  body_text TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_discussion_threads_entity ON discussion_threads(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_thread ON discussion_replies(thread_id);
```

### Progress reports (snapshots for student/parent)

```sql
-- Weekly/monthly report snapshots
CREATE TABLE IF NOT EXISTS progress_reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly')),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  quizzes_completed INTEGER DEFAULT 0,
  exams_completed INTEGER DEFAULT 0,
  total_score_percent REAL,
  topics_mastered INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  summary_json TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_progress_reports_user ON progress_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_reports_period ON progress_reports(user_id, period_start);
```

### Accessibility & user preferences

```sql
-- User preferences (font size, dark mode, TTS, low-data, etc.)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  text_to_speech INTEGER DEFAULT 0,
  low_data_mode INTEGER DEFAULT 0,
  auto_play_audio INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now'))
);
```

---

## 🏗 Phased Build Plan

### Phase 1 — Foundation (do first)

1. **Schema**  
   Add tables above in order: `lessons`, `lesson_progress`, `user_highlights`, `user_bookmarks`, `formula_vault`, `question_hints`, `user_topic_performance`, `user_preferences`.

2. **Adaptive difficulty**  
   - When building a quiz from the question bank, filter by `difficulty` and optionally by `user_topic_performance` (e.g. serve harder if last score > 80%, easier if < 50%).  
   - No new tables; use existing `question_bank.difficulty` and new `user_topic_performance`.

3. **Weakness tracker**  
   - On quiz/exam complete: upsert `user_topic_performance` (subject, strand, sub_strand, attempts, correct, last score).  
   - Dashboard API: return weak topics (e.g. last_score_percent < 70 or low attempts) and optionally `practice_recommendations`.

4. **Step-by-step solutions**  
   - Add `question_hints` and seed a few rows per question (hint 1, hint 2, full solution, video URL).  
   - Quiz UI: “Hint” / “Show solution” buttons that load next step from API.

5. **Accessibility**  
   - `user_preferences`: font_size, theme, text_to_speech, low_data_mode.  
   - Frontend: apply theme/font, optional TTS on lesson/question text.

### Phase 2 — Notes, timer, planner, flashcards

6. **Smart notes**  
   - APIs: CRUD for `user_highlights`, `user_bookmarks` (entity_type = lesson | library_resource).  
   - Lesson/resource reader UI: highlight, add note, bookmark; list “My notes” / “My bookmarks”.

7. **Study timer (Pomodoro)**  
   - Client-side 25/5 timer; optional API: POST `study_sessions` (focus/break, duration, subject).

8. **Study planner**  
   - CRUD `study_goals`, `study_schedule`; optional reminders (client or backend job).

9. **Flashcards**  
   - Create `flashcard_sets` and `flashcards` (manual or auto from question_bank).  
   - Spaced repetition: `flashcard_reviews` with next_review_at; API “get due cards” and “record review”.

10. **Formula vault**  
    - Seed `formula_vault` by subject/strand; API list/search; UI “Formula vault” page (searchable, printable).

### Phase 3 — Questions, mistakes, reports, exam simulator

11. **Ask-a-question**  
    - CRUD `student_questions`; teacher answers in same table; show “Q&A” on lesson/topic page.

12. **Mistake review**  
    - On wrong answer (quiz): insert/update `mistake_log`.  
    - “My mistakes” page: list by topic, retry, show explanation.

13. **Progress reports**  
    - Weekly job (or on-demand): aggregate attempts, scores, time, streak → insert `progress_reports`.  
    - Student and parent dashboards: “View report” for last week/month.

14. **Exam simulator**  
    - Reuse written exam flow; add “Exam mode” UI: strict timer, no back navigation, flag-for-review, final review screen before submit; marking as now (auto + manual).

### Phase 4 — Paths, discussions, games, live

15. **Learning path**  
    - Diagnostic quiz → recommend order of strands/sub_strands; store in `practice_recommendations` or a new `learning_path` table.

16. **Discussion boards**  
    - CRUD `discussion_threads`, `discussion_replies`; per-topic page with thread list and replies (moderate via status or role).

17. **Learning games / experiment mode**  
    - New content types or “game” quiz types; virtual labs = custom UI + optional `experiment_simulations` table later.

18. **Live help**  
    - Optional: `live_sessions` table (schedule, link); calendar + join link.

---

## ✅ Cursor build prompts (copy-paste)

Use these one at a time.

**1. Schema**  
“Add the new learning-support tables from LEARNING_SUPPORT_FEATURES.md (lessons, lesson_progress, user_highlights, user_bookmarks, formula_vault, question_hints, user_topic_performance, practice_recommendations, study_sessions, study_goals, study_schedule, flashcard_sets, flashcards, flashcard_reviews, mistake_log, student_questions, discussion_threads, discussion_replies, progress_reports, user_preferences) to `backend/db/schema.js` with migrations for existing DBs.”

**2. Adaptive difficulty**  
“Implement adaptive difficulty for quiz generation: when creating a quiz from the question bank, consider the student’s last score for that subject/strand (from user_topic_performance or quiz_attempts). If last score &gt; 80% prefer harder questions; if &lt; 50% prefer easier; otherwise mixed. Expose optional query param `adaptive=1` on generate-quiz.”

**3. Weakness tracker**  
“On quiz attempt complete, upsert user_topic_performance (subject, strand, sub_strand, attempts_count, correct_count, last_score_percent). Add GET /api/engagement/weaknesses that returns weak topics (e.g. last_score_percent &lt; 70 or few attempts) and optional practice_recommendations. Show weaknesses on the student dashboard.”

**4. Step-by-step hints**  
“Add question_hints table and API GET /api/question-hints?question_entity_type=quiz_question&question_entity_id=... returning ordered steps (hint, full_solution, explanation_video). In Jiggle Your Mind quiz UI, add ‘Hint’ and ‘Show solution’ buttons that fetch and display the next step.”

**5. User preferences (accessibility)**  
“Add user_preferences table and GET/PATCH /api/engagement/preferences (font_size, theme, text_to_speech, low_data_mode). On login or settings page, load preferences and apply theme and font size to the app; add a settings panel for accessibility.”

---

## 📊 Monetization hooks (optional)

- **Free:** Core quizzes, library, progress, streaks, basic weakness view.  
- **Premium:** Learning path, full mistake review + retry packs, progress reports PDF, exam simulator, flashcards with spaced repetition, ask-a-question (e.g. N per month).  
- **School:** Discussion boards, live help, bulk progress reports, admin analytics.

---

You can start with **Phase 1** (schema + adaptive difficulty + weakness tracker + step-by-step hints + accessibility) and then add phases 2–4 incrementally. If you tell me which phase or feature to implement first (e.g. “schema only” or “weakness tracker + dashboard”), I can generate the exact code changes next.
