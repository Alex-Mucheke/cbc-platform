# TODO - CBC Platform unified learning engine improvements

## Step 1 — Implement competency-based weakness detection
- Update backend engagement weakness logic to compute weakness from competency performance using the term-planner tables (`content_competencies`, `competencies`, `content_learning_outcomes`, `learning_outcomes`).
- Keep existing `apiEngagementWeaknesses()` response shape while swapping computation.
- Ensure compatibility with current quiz/written exam attempt recording.

## Step 2 — Normalize scheme_weeks mapping (TEXT arrays → joins)
- Create join tables for `scheme_weeks` learning outcomes and competencies.
- Provide/update API queries and (if needed) seed/migrations.

## Step 3 — Wire adaptive quiz selection to competency-first
- Modify adaptive quiz selection to pick weak competency first.

## Step 4 — Add student term/week progress tracking
- Add `user_week_progress` table.
- Update logic when completing lessons/quizzes/exams.

## Step 5 — Parent dashboard real data pipeline
- Add parent → child linkage API and compute child progress summaries.

