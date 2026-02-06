# High-Impact Add-On Features — CBC Platform

**Current stack:** React 18 + TypeScript + Vite + Tailwind | Node/Express + SQLite (better-sqlite3) | JWT auth, role-based (student, teacher, parent, admin).

---

## What’s Already Implemented

| Feature | Status | Where |
|--------|--------|--------|
| **Daily challenge** | ✅ Backend + UI | `daily_challenges` table, GET/POST engagement/daily-challenge, StudentDashboard |
| **Streak counter** | ✅ | `user_streaks`, updated on quiz/exam complete, summary API |
| **XP + level** | ✅ | `user_xp`, badge XP rewards, summary |
| **Badges** | ✅ | `badges`, `user_badges`, criteria-based (first_quiz, quiz_streak_7, score_90, quizzes_10, first_exam) |
| **Visual progress bars** | ✅ | Subject completion % from `user_progress`, dashboard |
| **Weakness detector** | ✅ | `user_topic_performance`, GET weaknesses, suggested practice structure |
| **Step-by-step hints** | ✅ | `question_hints`, GET engagement/question-hints, quiz UI |
| **User preferences** | ✅ | `user_preferences` (theme, font_size, TTS, low_data_mode) |
| **Typed written exams** | ✅ | Written exams, teacher marking, rubrics, autosave |
| **Jiggle Your Mind** | ✅ | Quizzes, MCQ/true-false, timer, instant feedback |
| **Sitting Exam** | ✅ | Written exams, timed, one attempt option, teacher marking |
| **Library (CBC)** | ✅ | Grades → subjects → strands, resources, view/download |
| **Student dashboard** | ✅ | Summary, progress, daily challenge, weaknesses, recent activity |
| **Teacher dashboard** | ✅ | Page exists; create quizzes, upload, track (partial) |
| **Parent dashboard** | ✅ | Page exists; placeholder data (needs real API) |

---

## Feature Map: Your List vs Implementation

### Engagement Boosters

| Requested | Status | Add-on |
|-----------|--------|--------|
| Daily challenge per subject | ✅ Done (one per day, any subject) | Optional: one per subject per day |
| Streak counter | ✅ Done | — |
| Bonus points for consistency | ✅ Partial (XP on complete) | Add “daily challenge bonus” + “come back tomorrow” copy |
| “Come back tomorrow” reward | 🔲 Add | UI copy + optional bonus XP for next-day return |

### Skill Badges (CBC-style)

| Requested | Status | Add-on |
|-----------|--------|--------|
| Badges per competency | ✅ Generic badges exist | Add CBC-style badges (e.g. *Fractions Pro*, *Reading Fluency L3*) |
| Visible on profile | ✅ Dashboard shows count | Add “My badges” section / profile page |

### Visual Progress

| Requested | Status | Add-on |
|-----------|--------|--------|
| Topic completion % | ✅ Done | — |
| Subject mastery % | ✅ Done | — |
| Grade readiness meter | 🔲 Add | **Readiness score** “You are X% ready for Grade Y” |

### Smart Learning

| Requested | Status | Add-on |
|-----------|--------|--------|
| Weakness detector | ✅ Done | Optional: auto-assign revision sets from `practice_recommendations` |
| Adaptive quiz (easy→hard) | 🔲 Add | Use `user_topic_performance` + difficulty in question selection |
| Typed exams + teacher marking | ✅ Done | — |

### Content Power

| Requested | Status | Add-on |
|-----------|--------|--------|
| Topic packs (notes+video+quiz+exam+flashcards) | 🔲 Add | Bundle view by strand/sub_strand; lessons table exists |
| Auto-generated worksheets | 🔲 Add | Export PDF, randomized from question_bank |
| Micro-lessons (3–5 min) | 🔲 Add | `lessons` has video_url; add “Micro-lessons” view |

### Teacher & Parent

| Requested | Status | Add-on |
|-----------|--------|--------|
| Teacher: assign, create, upload, track | Partial | APIs exist; UI needs assignment flow + class list |
| Parent: child progress, weekly report, weak areas | 🔲 Add | Parent needs child-linked API + real data |

### Gamification

| Requested | Status | Add-on |
|-----------|--------|--------|
| Jiggle Your Mind (brain teasers, timed) | ✅ Quizzes exist | Add “logic puzzle” type or tag |
| **Leaderboards** | 🔲 Add | **Class / school leaderboard** (XP or weekly score) |

### Experience

| Requested | Status | Add-on |
|-----------|--------|--------|
| Offline mode | 🔲 Add | Service worker + cache notes/quizzes |
| Smart reminders | 🔲 Add | Study reminders, deadlines (backend job or client) |

### Interaction

| Requested | Status | Add-on |
|-----------|--------|--------|
| Ask-a-Teacher | 🔲 Add | `student_questions` table + CRUD API |
| Peer discussion | 🔲 Add | `discussion_threads` / `replies` |

### Assessment

| Requested | Status | Add-on |
|-----------|--------|--------|
| Real exam simulator (timed, lock nav) | Partial | Written exam is timed; add “strict mode” (no back, flag for review) |
| **Readiness score** | 🔲 Add | **“You are X% ready for Grade Y assessment”** |

### Automation & Analytics

| Requested | Status | Add-on |
|-----------|--------|--------|
| Auto question generator | 🔲 Add | From notes (future AI) or from question_bank templates |
| Learning analytics (admin) | 🔲 Add | Most failed topics, engagement heatmap |

---

## Priority Order (Implementation-First)

**Phase 1 — Quick wins (already partially there)**  
1. **Readiness score** — API + one widget on student dashboard.  
2. **Leaderboard** — By XP or weekly activity; one API + one UI block.  
3. **Daily challenge polish** — “Come back tomorrow” + bonus XP copy when already done.

**Phase 2 — Engagement & content**  
4. CBC-style competency badges (seed + profile section).  
5. Topic pack view (strand → lessons + quiz + exam + flashcards link).  
6. Parent dashboard real data (child progress API + link parent to student).

**Phase 3 — Smart & teacher**  
7. Adaptive quiz (difficulty from `user_topic_performance`).  
8. Exam simulator strict mode (lock navigation, review screen).  
9. Teacher: assign task + class list API.

**Phase 4 — Content & interaction**  
10. Ask-a-Teacher (student_questions table + API + UI).  
11. Auto-generated worksheet (PDF from question_bank).  
12. Smart reminders (optional backend job or client-only).

---

## DB / API / UI Summary for Phase 1

### 1. Readiness score

- **DB:** None (derive from `user_progress`, `user_topic_performance`, optional target grade).  
- **API:** `GET /api/engagement/readiness` → `{ grade_id, grade_name, readiness_percent, message }`.  
- **UI:** One card on Student dashboard: “You are X% ready for Grade Y assessment.”

### 2. Leaderboard

- **DB:** Optional `classes` / `schools` if you want class/school filters; else use global.  
- **API:** `GET /api/engagement/leaderboard?scope=global|class&limit=10` → list of `{ rank, user_id, full_name, xp_or_score }`.  
- **UI:** “Top learners” section on Student dashboard (and optionally Exam Center).

### 3. Daily challenge “come back tomorrow”

- **DB:** None.  
- **API:** None (existing daily-challenge response already indicates `attempted`).  
- **UI:** When `attempted` is set, show “Come back tomorrow for the next challenge + bonus XP” and optional streak reminder.

---

## Rollout (30–60–90 days)

| Window | Focus |
|--------|--------|
| **0–30 days** | Readiness score, leaderboard, daily challenge copy; optional CBC badge seed. |
| **30–60 days** | Topic packs view, parent real data, adaptive quiz, exam strict mode. |
| **60–90 days** | Ask-a-Teacher, worksheets PDF, reminders; analytics for admin. |

---

## Next Step

Phase 1 (readiness score, leaderboard, daily challenge polish) is implemented next in code: APIs first, then dashboard UI.
