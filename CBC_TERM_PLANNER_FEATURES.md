# CBC Term Planner & Scheme Builder — Feature Plan

**Stack:** React 18 + TypeScript + Vite + Tailwind | Node/Express + SQLite (better-sqlite3).

**Existing spine:** Grade → Subject → Strand → Sub-strand (already in DB). This plan adds **Term → Week** and CBC mapping on top.

---

## 1. Feature Priority Order

| # | Feature | Why first | Depends on |
|---|---------|-----------|------------|
| 1 | **Term–Week structure** | Main navigation spine (Grade → Subject → Term → Week) | grades, subjects |
| 2 | **CBC mapping layer** | Every content item: strand, sub_strand, competency, learning_outcome | strands, sub_strands |
| 3 | **Scheme of Work builder** | Teachers build schemes by term/week; link activities & resources | terms, weeks, CBC mapping |
| 4 | **Weekly objective + assessment linker** | When teacher adds objective → prompt: quiz, rubric, checklist | scheme_weeks, quizzes, written_exams |
| 5 | **Pacing tracker** | Weeks completed, objectives covered, behind/ahead | scheme_of_work, teacher delivery |
| 6 | **Subject resource packs** | One-click pack: schemes, notes, worksheets per grade/term/subject | schemes, library |
| 7 | **Editable / clone & customize** | Editable schemes & lesson plans; “Clone & Customize” | scheme_of_work, lessons |
| 8 | **TPAD2 evidence mode** | Log lessons delivered, assessments, competency coverage → export report | pacing, schemes, users |
| 9 | **Continuous assessment toolkit** | Rubric builder, checklist builder, observation forms | question_bank, written_exams |
| 10 | **Update notifications** | “New Term 2 schemes added”; change log | scheme_of_work, notifications |
| 11 | **Request resource + upvote** | “Request Resource”, upvote, notify when fulfilled | library, users |
| 12 | **Smart cross-linking** | Open “Grade 7 Term 1 Math Week 3” → sidebar: related quizzes, worksheets, competencies | CBC mapping, scheme_weeks |

---

## 2. Database Schema for CBC Mapping & Term Planner

Run this **after** your existing schema (so `grades`, `subjects`, `strands`, `sub_strands` exist).

### 2.1 Terms & Weeks (term-based spine)

```sql
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

-- Weeks per term (Week 1, Week 2, …)
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
```

### 2.2 Learning outcomes & performance indicators (CBC)

```sql
-- Learning outcomes (linked to strand/sub_strand, optional term/week)
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

-- Performance indicators (optional: more granular than outcomes)
CREATE TABLE IF NOT EXISTS performance_indicators (
  id TEXT PRIMARY KEY,
  learning_outcome_id TEXT NOT NULL REFERENCES learning_outcomes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_perf_indicators_outcome ON performance_indicators(learning_outcome_id);

-- Competencies (e.g. "Reading Fluency L3", "Fractions Pro")
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
```

### 2.3 CBC mapping on existing content (link quizzes, exams, resources to outcomes/competencies)

```sql
-- Link quizzes to CBC (strand, sub_strand, competency, learning_outcome already partially in schema; add explicit outcome/competency)
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

CREATE TABLE IF NOT EXISTS content_competencies (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('quiz', 'written_exam', 'library_resource', 'lesson', 'scheme_activity')),
  entity_id TEXT NOT NULL,
  competency_id TEXT NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(entity_type, entity_id, competency_id)
);
CREATE INDEX IF NOT EXISTS idx_content_comp_entity ON content_competencies(entity_type, entity_id);
```

### 2.4 Scheme of Work (teacher-built, per grade/subject/term)

```sql
-- One scheme per grade + subject + term (teacher or school)
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

-- Weekly rows in a scheme (objectives, activities, assessments, competencies)
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

-- Link scheme week to assessments (quiz, project, rubric, checklist)
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
```

### 2.5 Pacing & TPAD2

```sql
-- Pacing: which weeks/objectives has the teacher covered (per class or per scheme)
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

-- TPAD2 evidence (aggregate view can be built from pacing_log + quizzes + written_exams + learner progress)
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
```

### 2.6 Resource requests & update notifications

```sql
-- Resource requests (teachers request missing subjects/resources)
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

-- Change log for “New Term 2 schemes added” / update notifications
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
```

### 2.7 Rubrics & checklists (continuous assessment toolkit)

```sql
-- Rubric definitions (for teachers to attach to objectives/assessments)
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

-- Checklist definitions
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
```

---

## 3. Main Navigation Spine (UI)

- **Primary nav:** Grade → Subject → Term → Week.  
- **Secondary:** Strand / Sub-strand filters; “This week” quick link.
- **URL pattern:** `/plan/grade/:gradeId/subject/:subjectId/term/:termId/week/:weekId` (or same with slugs).

**Wireframe (main area):**

```
[ Sidebar: Grade 7 > Mathematics > Term 1 > Week 1–13 ]
[ Breadcrumb: Grade 7 / Mathematics / Term 1 / Week 3 ]

Week 3 — Numbers: Fractions
├── Learning outcomes (list, from learning_outcomes where term_week_id = …)
├── Activities (from scheme_weeks or default)
├── Assessments (quizzes, worksheets, rubric — from scheme_week_assessments)
└── Related (cross-link: quizzes, worksheets, videos, competencies)
```

---

## 4. Teacher Dashboard Additions

- **Pacing summary:** Weeks completed / total; “On track” / “Behind” / “Ahead” (from `pacing_log` vs `scheme_weeks`).
- **Quick actions:** “Create scheme”, “Log week completed”, “Export TPAD2 report”.
- **Alerts:** “New Term 2 schemes added” (from `content_change_log`); “Resource request fulfilled”.

---

## 5. Scheme Builder Logic (backend)

1. **Create scheme:** POST `/api/schemes` — body: `grade_id`, `subject_id`, `term_id`, `title`. Insert `scheme_of_work`; optionally copy from template or previous term.
2. **List weeks:** GET `/api/schemes/:id/weeks` — join `scheme_weeks` + `term_weeks` for that term.
3. **Save week:** PUT `/api/schemes/weeks/:id` — update `weekly_objectives`, `activities`, `learning_outcome_ids`, `competency_ids`; replace `scheme_week_assessments` for that week.
4. **Link assessment:** POST `/api/schemes/weeks/:id/assessments` — body: `assessment_type`, `entity_type`, `entity_id` (e.g. quiz id).
5. **Export:** GET `/api/schemes/:id/export?format=pdf|word|print` — server builds doc (e.g. with a library like pdfkit or docx) or returns JSON for a print view.

---

## 6. Competency Tracking Engine (backend)

- **Coverage:** For a given grade/subject/term (or week), compute which competencies have at least one linked content item (quiz, exam, lesson, scheme activity). Expose e.g. GET `/api/competencies/coverage?grade_id=&subject_id=&term_id=`.
- **Gaps:** Competencies with no linked content or no completed activities (from `user_progress` / `pacing_log`). Expose e.g. GET `/api/competencies/gaps?grade_id=&subject_id=`.
- **Reports:** “Competency coverage report” for teacher/TPAD2: list competencies with % learners who attempted linked content and/or achieved threshold.

---

## 7. Implementation Order (recommended)

1. **Migration:** Add tables: `terms`, `term_weeks`, `learning_outcomes`, `competencies`, `content_learning_outcomes`, `content_competencies`, `scheme_of_work`, `scheme_weeks`, `scheme_week_assessments`.
2. **Seed:** One grade (e.g. Grade 7) with 3 terms and 13 weeks per term; a few learning outcomes and competencies.
3. **APIs:** Terms, weeks, learning outcomes, schemes CRUD, scheme weeks + assessments.
4. **UI:** Term planner nav (Grade → Subject → Term → Week); scheme list and scheme builder (weekly objectives + assessment linker).
5. **Pacing:** `pacing_log` API + teacher dashboard widget.
6. **Then:** Resource requests, change log/notifications, TPAD2 export, rubric/checklist builders.

---

## 8. File / Route Map (this codebase)

| Feature | Backend | Frontend |
|---------|---------|----------|
| Terms & weeks | `routes/meta.js` or `routes/terms.js` | `pages/plan/TermPlannerPage.tsx` |
| Schemes | `routes/schemes.js` | `pages/teacher/SchemeBuilderPage.tsx` |
| CBC mapping | `routes/meta.js` (outcomes, competencies) | Filters on Library, Exam Center, Quiz |
| Pacing | `routes/engagement.js` or `routes/pacing.js` | Teacher dashboard section |
| Resource requests | `routes/resourceRequests.js` | “Request resource” on Library + list |
| Change log | `routes/notifications.js` or meta | Header alert + “What’s new” page |

If you want, next step can be: **add the migration file** (`backend/db/term-planner-schema.js`) and **stub routes** for terms, scheme CRUD, and one teacher page (term planner or scheme list).
