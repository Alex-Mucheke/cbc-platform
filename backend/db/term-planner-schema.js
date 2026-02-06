/**
 * Term Planner & CBC mapping schema.
 * Run after main schema (grades, subjects, strands, sub_strands must exist).
 */

export function runTermPlannerSchema(db) {
  db.exec(`
    -- Terms per grade (e.g. Grade 7 → Term 1, 2, 3)
    CREATE TABLE IF NOT EXISTS terms (
      id TEXT PRIMARY KEY,
      grade_id TEXT NOT NULL REFERENCES grades(id),
      name TEXT NOT NULL,
      term_number INTEGER NOT NULL CHECK (term_number >= 1 AND term_number <= 3),
      start_date TEXT,
      end_date TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(grade_id, term_number)
    );
    CREATE INDEX IF NOT EXISTS idx_terms_grade ON terms(grade_id);

    -- Weeks per term
    CREATE TABLE IF NOT EXISTS term_weeks (
      id TEXT PRIMARY KEY,
      term_id TEXT NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
      week_number INTEGER NOT NULL,
      title TEXT,
      start_date TEXT,
      end_date TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(term_id, week_number)
    );
    CREATE INDEX IF NOT EXISTS idx_term_weeks_term ON term_weeks(term_id);

    -- Learning outcomes (CBC)
    CREATE TABLE IF NOT EXISTS learning_outcomes (
      id TEXT PRIMARY KEY,
      grade_id TEXT NOT NULL REFERENCES grades(id),
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      strand_id TEXT REFERENCES strands(id),
      sub_strand_id TEXT REFERENCES sub_strands(id),
      term_id TEXT REFERENCES terms(id),
      term_week_id TEXT REFERENCES term_weeks(id),
      code TEXT,
      description TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_learning_outcomes_grade_subject ON learning_outcomes(grade_id, subject_id);
    CREATE INDEX IF NOT EXISTS idx_learning_outcomes_strand ON learning_outcomes(strand_id);
    CREATE INDEX IF NOT EXISTS idx_learning_outcomes_week ON learning_outcomes(term_week_id);

    -- Performance indicators
    CREATE TABLE IF NOT EXISTS performance_indicators (
      id TEXT PRIMARY KEY,
      learning_outcome_id TEXT NOT NULL REFERENCES learning_outcomes(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_perf_indicators_outcome ON performance_indicators(learning_outcome_id);

    -- Competencies
    CREATE TABLE IF NOT EXISTS competencies (
      id TEXT PRIMARY KEY,
      grade_id TEXT NOT NULL REFERENCES grades(id),
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      strand_id TEXT REFERENCES strands(id),
      sub_strand_id TEXT REFERENCES sub_strands(id),
      code TEXT,
      name TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_competencies_grade_subject ON competencies(grade_id, subject_id);

    -- Content → learning outcomes
    CREATE TABLE IF NOT EXISTS content_learning_outcomes (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL CHECK (entity_type IN ('quiz', 'written_exam', 'library_resource', 'lesson', 'scheme_activity')),
      entity_id TEXT NOT NULL,
      learning_outcome_id TEXT NOT NULL REFERENCES learning_outcomes(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(entity_type, entity_id, learning_outcome_id)
    );
    CREATE INDEX IF NOT EXISTS idx_content_lo_entity ON content_learning_outcomes(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_content_lo_outcome ON content_learning_outcomes(learning_outcome_id);

    -- Content → competencies
    CREATE TABLE IF NOT EXISTS content_competencies (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL CHECK (entity_type IN ('quiz', 'written_exam', 'library_resource', 'lesson', 'scheme_activity')),
      entity_id TEXT NOT NULL,
      competency_id TEXT NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(entity_type, entity_id, competency_id)
    );
    CREATE INDEX IF NOT EXISTS idx_content_comp_entity ON content_competencies(entity_type, entity_id);

    -- Scheme of work
    CREATE TABLE IF NOT EXISTS scheme_of_work (
      id TEXT PRIMARY KEY,
      grade_id TEXT NOT NULL REFERENCES grades(id),
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      term_id TEXT NOT NULL REFERENCES terms(id),
      title TEXT NOT NULL,
      created_by TEXT REFERENCES users(id),
      school_id TEXT,
      is_editable INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_scheme_grade_subject_term ON scheme_of_work(grade_id, subject_id, term_id);

    -- Scheme weeks (objectives, activities, assessments)
    CREATE TABLE IF NOT EXISTS scheme_weeks (
      id TEXT PRIMARY KEY,
      scheme_id TEXT NOT NULL REFERENCES scheme_of_work(id) ON DELETE CASCADE,
      term_week_id TEXT NOT NULL REFERENCES term_weeks(id),
      strand_id TEXT REFERENCES strands(id),
      sub_strand_id TEXT REFERENCES sub_strands(id),
      weekly_objectives TEXT,
      activities TEXT,
      learning_outcome_ids TEXT,
      competency_ids TEXT,
      notes TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(scheme_id, term_week_id)
    );
    CREATE INDEX IF NOT EXISTS idx_scheme_weeks_scheme ON scheme_weeks(scheme_id);

    -- Scheme week → assessments
    CREATE TABLE IF NOT EXISTS scheme_week_assessments (
      id TEXT PRIMARY KEY,
      scheme_week_id TEXT NOT NULL REFERENCES scheme_weeks(id) ON DELETE CASCADE,
      assessment_type TEXT NOT NULL CHECK (assessment_type IN ('quiz', 'written_exam', 'project', 'rubric', 'checklist', 'observation')),
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(scheme_week_id, entity_type, entity_id)
    );
    CREATE INDEX IF NOT EXISTS idx_scheme_week_assessments_week ON scheme_week_assessments(scheme_week_id);

    -- Pacing log
    CREATE TABLE IF NOT EXISTS pacing_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      scheme_id TEXT NOT NULL REFERENCES scheme_of_work(id) ON DELETE CASCADE,
      scheme_week_id TEXT NOT NULL REFERENCES scheme_weeks(id) ON DELETE CASCADE,
      completed_at TEXT NOT NULL DEFAULT (datetime('now')),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, scheme_week_id)
    );
    CREATE INDEX IF NOT EXISTS idx_pacing_log_teacher ON pacing_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_pacing_log_scheme ON pacing_log(scheme_id);

    -- TPAD2 evidence
    CREATE TABLE IF NOT EXISTS tpad2_evidence_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      evidence_type TEXT NOT NULL CHECK (evidence_type IN ('lesson_delivered', 'assessment_created', 'learner_progress', 'competency_coverage', 'scheme_used')),
      entity_type TEXT,
      entity_id TEXT,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      summary_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_tpad2_user_period ON tpad2_evidence_log(user_id, period_start);

    -- Resource requests
    CREATE TABLE IF NOT EXISTS resource_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      grade_id TEXT REFERENCES grades(id),
      subject_id TEXT REFERENCES subjects(id),
      request_type TEXT NOT NULL CHECK (request_type IN ('subject', 'scheme', 'worksheet', 'other')),
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'fulfilled', 'closed')),
      fulfilled_at TEXT,
      fulfilled_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_resource_requests_status ON resource_requests(status);
    CREATE INDEX IF NOT EXISTS idx_resource_requests_user ON resource_requests(user_id);

    CREATE TABLE IF NOT EXISTS resource_request_upvotes (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL REFERENCES resource_requests(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(request_id, user_id)
    );

    -- Content change log (notifications)
    CREATE TABLE IF NOT EXISTS content_change_log (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL CHECK (entity_type IN ('scheme_of_work', 'library_resource', 'lesson', 'quiz', 'written_exam')),
      entity_id TEXT NOT NULL,
      change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'published')),
      title TEXT,
      grade_id TEXT REFERENCES grades(id),
      subject_id TEXT REFERENCES subjects(id),
      term_id TEXT REFERENCES terms(id),
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_change_log_entity ON content_change_log(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_change_log_created ON content_change_log(created_at);

    -- Rubrics & checklists
    CREATE TABLE IF NOT EXISTS rubrics (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      grade_id TEXT REFERENCES grades(id),
      subject_id TEXT REFERENCES subjects(id),
      created_by TEXT REFERENCES users(id),
      criteria_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS checklists (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      grade_id TEXT REFERENCES grades(id),
      subject_id TEXT REFERENCES subjects(id),
      created_by TEXT REFERENCES users(id),
      items_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Timetable slots: weekly schedule per grade (day 1=Mon .. 5=Fri, start_time/end_time HH:MM)
    CREATE TABLE IF NOT EXISTS timetable_slots (
      id TEXT PRIMARY KEY,
      grade_id TEXT NOT NULL REFERENCES grades(id),
      day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 5),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      title TEXT NOT NULL,
      strand_id TEXT REFERENCES strands(id),
      competency_hint TEXT,
      link_type TEXT CHECK (link_type IN ('quiz', 'lesson', 'library', 'written_exam', '')),
      link_id TEXT,
      is_suggested INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_timetable_slots_grade_day ON timetable_slots(grade_id, day_of_week);

    -- Calendar events: lessons, quizzes, exams, assignments, holidays, announcements
    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      grade_id TEXT REFERENCES grades(id),
      subject_id TEXT REFERENCES subjects(id),
      title TEXT NOT NULL,
      event_type TEXT NOT NULL CHECK (event_type IN ('lesson', 'quiz', 'assignment', 'exam', 'event', 'holiday', 'announcement')),
      date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      entity_type TEXT CHECK (entity_type IN ('quiz', 'written_exam', 'library_resource', 'timetable_slot', '')),
      entity_id TEXT,
      description TEXT,
      term_id TEXT REFERENCES terms(id),
      competency_hint TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(date);
    CREATE INDEX IF NOT EXISTS idx_calendar_events_grade ON calendar_events(grade_id);
  `);
}
