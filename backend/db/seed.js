/**
 * Seed data: subjects, grades, sample quizzes (Jiggle Your Mind), sample written exam (Sitting Exam).
 * Run from backend: node db/seed.js  or  npm run seed
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runSchema } from './schema.js';
import { runTermPlannerSchema } from './term-planner-schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'cbc.db');

const db = new Database(dbPath);
runSchema(db);
runTermPlannerSchema(db);

// Fixed IDs for idempotent seed
const SUBJECT_MATH = 'seed-subject-math';
const SUBJECT_ENG = 'seed-subject-eng';
const SUBJECT_SCI = 'seed-subject-sci';
const SUBJECT_KIS = 'seed-subject-kis';
const SUBJECT_SST = 'seed-subject-sst';
const SUBJECT_ART = 'seed-subject-art';
const GRADE_6 = 'seed-grade-6';
const GRADE_7 = 'seed-grade-7';

const subjects = [
  { id: SUBJECT_MATH, name: 'Mathematics', code: 'MATH' },
  { id: SUBJECT_ENG, name: 'English', code: 'ENG' },
  { id: SUBJECT_SCI, name: 'Science', code: 'SCI' },
  { id: SUBJECT_KIS, name: 'Kiswahili', code: 'KIS' },
  { id: SUBJECT_SST, name: 'Social Studies', code: 'SST' },
  { id: SUBJECT_ART, name: 'Creative Arts', code: 'ART' },
];
const subjectIds = { MATH: SUBJECT_MATH, ENG: SUBJECT_ENG, SCI: SUBJECT_SCI, KIS: SUBJECT_KIS, SST: SUBJECT_SST, ART: SUBJECT_ART };
subjects.forEach((s) => {
  db.prepare('INSERT OR REPLACE INTO subjects (id, name, code) VALUES (?, ?, ?)').run(s.id, s.name, s.code);
});

// Grade 1–9 (Lower Primary, Upper Primary, Junior Secondary)
const grades = [
  { id: 'seed-grade-1', name: 'Grade 1', sort_order: 1 },
  { id: 'seed-grade-2', name: 'Grade 2', sort_order: 2 },
  { id: 'seed-grade-3', name: 'Grade 3', sort_order: 3 },
  { id: 'seed-grade-4', name: 'Grade 4', sort_order: 4 },
  { id: 'seed-grade-5', name: 'Grade 5', sort_order: 5 },
  { id: GRADE_6, name: 'Grade 6', sort_order: 6 },
  { id: GRADE_7, name: 'Grade 7', sort_order: 7 },
  { id: 'seed-grade-8', name: 'Grade 8', sort_order: 8 },
  { id: 'seed-grade-9', name: 'Grade 9', sort_order: 9 },
];
const gradeIds = {};
grades.forEach((g) => {
  gradeIds[g.name] = g.id;
  db.prepare('INSERT OR REPLACE INTO grades (id, name, sort_order) VALUES (?, ?, ?)').run(g.id, g.name, g.sort_order);
});

// Extra subjects (Lower/Upper Primary, Junior Secondary)
const extraSubjects = [
  { id: 'seed-subject-lit', name: 'Literacy', code: 'LIT' },
  { id: 'seed-subject-env', name: 'Environmental Activities', code: 'ENV' },
  { id: 'seed-subject-sct', name: 'Science & Technology', code: 'SCT' },
  { id: 'seed-subject-cre', name: 'CRE', code: 'CRE' },
  { id: 'seed-subject-agr', name: 'Agriculture', code: 'AGR' },
  { id: 'seed-subject-ints', name: 'Integrated Science', code: 'INTS' },
  { id: 'seed-subject-cs', name: 'Computer Studies', code: 'CS' },
  { id: 'seed-subject-pt', name: 'Pre-Technical', code: 'PT' },
  { id: 'seed-subject-bs', name: 'Business Studies', code: 'BS' },
];
extraSubjects.forEach((s) => {
  db.prepare('INSERT OR REPLACE INTO subjects (id, name, code) VALUES (?, ?, ?)').run(s.id, s.name, s.code);
});

// Strands — Grade 1–9 coverage (Lower Primary, Upper Primary, Junior Secondary)
const strandIds = {};
const strandsList = [
  // Math: Grade 4, 5, 6, 7
  { id: 'seed-strand-num4', subject_id: SUBJECT_MATH, grade_id: gradeIds['Grade 4'], name: 'Numbers', sort_order: 1 },
  { id: 'seed-strand-num', subject_id: SUBJECT_MATH, grade_id: GRADE_6, name: 'Numbers', sort_order: 1 },
  { id: 'seed-strand-alg', subject_id: SUBJECT_MATH, grade_id: GRADE_6, name: 'Algebra', sort_order: 2 },
  { id: 'seed-strand-meas', subject_id: SUBJECT_MATH, grade_id: GRADE_6, name: 'Measurement', sort_order: 3 },
  { id: 'seed-strand-geom', subject_id: SUBJECT_MATH, grade_id: gradeIds['Grade 7'], name: 'Geometry', sort_order: 2 },
  { id: 'seed-strand-living', subject_id: SUBJECT_SCI, grade_id: GRADE_7, name: 'Living Things', sort_order: 1 },
  { id: 'seed-strand-matter', subject_id: SUBJECT_SCI, grade_id: GRADE_7, name: 'Matter', sort_order: 2 },
  { id: 'seed-strand-sci6', subject_id: SUBJECT_SCI, grade_id: GRADE_6, name: 'Physical & Human Body', sort_order: 1 },
  // English
  { id: 'seed-strand-eng-read', subject_id: SUBJECT_ENG, grade_id: GRADE_6, name: 'Reading', sort_order: 1 },
  { id: 'seed-strand-eng-write', subject_id: SUBJECT_ENG, grade_id: GRADE_6, name: 'Writing', sort_order: 2 },
  // Kiswahili, Social Studies, Integrated Science
  { id: 'seed-strand-kis', subject_id: SUBJECT_KIS, grade_id: GRADE_6, name: 'Kusikiliza na Kuzungumza', sort_order: 1 },
  { id: 'seed-strand-sst', subject_id: SUBJECT_SST, grade_id: GRADE_6, name: 'Social Environment', sort_order: 1 },
  { id: 'seed-strand-ints', subject_id: 'seed-subject-ints', grade_id: gradeIds['Grade 8'], name: 'Scientific Inquiry', sort_order: 1 },
];
strandsList.forEach((st) => {
  strandIds[st.id] = st.id;
  db.prepare('INSERT OR REPLACE INTO strands (id, subject_id, grade_id, name, sort_order) VALUES (?, ?, ?, ?, ?)').run(st.id, st.subject_id, st.grade_id, st.name, st.sort_order);
});

// Sub-strands
const subStrandIds = {};
const subStrandsList = [
  { id: 'seed-ss-frac', strand_id: 'seed-strand-num', name: 'Fractions', sort_order: 1 },
  { id: 'seed-ss-decimal', strand_id: 'seed-strand-num', name: 'Decimals', sort_order: 2 },
  { id: 'seed-ss-class', strand_id: 'seed-strand-living', name: 'Classification', sort_order: 1 },
  { id: 'seed-ss-env', strand_id: 'seed-strand-living', name: 'Environment', sort_order: 2 },
];
subStrandsList.forEach((ss) => {
  subStrandIds[ss.id] = ss.id;
  db.prepare('INSERT OR REPLACE INTO sub_strands (id, strand_id, name, sort_order) VALUES (?, ?, ?, ?)').run(ss.id, ss.strand_id, ss.name, ss.sort_order);
});

// --- Sample Library Resources (approved) — textbooks, workbooks, past papers ---
const libIds = ['seed-lib-1', 'seed-lib-2', 'seed-lib-3', 'seed-lib-4', 'seed-lib-5'];
const libraryResources = [
  { id: libIds[0], grade_id: gradeIds['Grade 7'], subject_id: SUBJECT_MATH, strand_id: null, sub_strand_id: null, resource_type: 'textbook', title: 'Mathematics Grade 7 Learner\'s Book', description: 'CBC-aligned mathematics textbook for Grade 7.', author: 'KICD', publisher: 'KICD', page_count: 240, status: 'approved', view_count: 1523, download_count: 420, marking_scheme_url: null, examiner_notes: null },
  { id: libIds[1], grade_id: gradeIds['Grade 6'], subject_id: SUBJECT_ENG, strand_id: null, sub_strand_id: null, resource_type: 'workbook', title: 'English Activities Grade 6', description: 'Practice activities for English Grade 6.', author: 'KICD', publisher: 'KICD', page_count: 180, status: 'approved', view_count: 2104, download_count: 567, marking_scheme_url: null, examiner_notes: null },
  { id: libIds[2], grade_id: gradeIds['Grade 7'], subject_id: SUBJECT_SCI, strand_id: 'seed-strand-living', sub_strand_id: null, resource_type: 'revision_notes', title: 'Science Grade 7 - Living Things Revision', description: 'Revision notes for Living Things strand.', author: 'CBC Learn', publisher: 'CBC Learn', page_count: 24, status: 'approved', view_count: 892, download_count: 234, marking_scheme_url: null, examiner_notes: null },
  { id: libIds[3], grade_id: gradeIds['Grade 6'], subject_id: SUBJECT_MATH, strand_id: 'seed-strand-num', sub_strand_id: 'seed-ss-frac', resource_type: 'summary_sheet', title: 'Fractions Summary - Grade 6', description: 'Quick reference for fractions.', author: 'CBC Learn', publisher: 'CBC Learn', page_count: 4, status: 'approved', view_count: 1200, download_count: 380, marking_scheme_url: null, examiner_notes: null },
  { id: libIds[4], grade_id: gradeIds['Grade 6'], subject_id: SUBJECT_MATH, strand_id: 'seed-strand-num', sub_strand_id: null, resource_type: 'past_paper', title: 'Grade 6 Mathematics End of Term 2 (2023)', description: 'Model CBC assessment with marking scheme.', author: 'CBC Learn', publisher: 'CBC Learn', page_count: 8, status: 'approved', view_count: 2100, download_count: 890, marking_scheme_url: '/files/math-g6-t2-ms.pdf', examiner_notes: 'Focus on problem-solving and showing working.' },
];
libraryResources.forEach((r) => {
  db.prepare(`
    INSERT OR REPLACE INTO library_resources (id, grade_id, subject_id, strand_id, sub_strand_id, resource_type, title, description, author, publisher, page_count, status, view_count, download_count, marking_scheme_url, examiner_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(r.id, r.grade_id, r.subject_id, r.strand_id, r.sub_strand_id, r.resource_type, r.title, r.description, r.author, r.publisher, r.page_count, r.status, r.view_count, r.download_count, r.marking_scheme_url || null, r.examiner_notes || null);
});

// --- Sample Question Bank (for exam generator) ---
const qb1 = randomUUID();
const qb2 = randomUUID();
const qb3 = randomUUID();
db.prepare(`
  INSERT OR REPLACE INTO question_bank (id, grade_id, subject_id, strand_id, sub_strand_id, difficulty, skill_tested, question_type, question_text, options_json, correct_option_id, explanation)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(qb1, gradeIds['Grade 6'], SUBJECT_MATH, 'seed-strand-num', 'seed-ss-frac', 'basic', 'Equivalent fractions', 'multiple_choice', 'Which fraction is equivalent to 1/2?', JSON.stringify([{ id: 'a', text: '2/4', is_correct: 1 }, { id: 'b', text: '1/3', is_correct: 0 }, { id: 'c', text: '3/6', is_correct: 1 }]), 'a', '1/2 = 2/4 = 3/6.');
db.prepare(`
  INSERT OR REPLACE INTO question_bank (id, grade_id, subject_id, strand_id, sub_strand_id, difficulty, skill_tested, question_type, question_text, options_json, correct_option_id, explanation)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(qb2, gradeIds['Grade 6'], SUBJECT_MATH, null, null, 'basic', 'Multiplication', 'true_false', 'True or False: 7 × 8 = 56.', null, 'true', '7 × 8 = 56.');
db.prepare(`
  INSERT OR REPLACE INTO question_bank (id, grade_id, subject_id, strand_id, sub_strand_id, difficulty, skill_tested, question_type, question_text, options_json, correct_option_id, explanation)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(qb3, gradeIds['Grade 7'], SUBJECT_SCI, 'seed-strand-living', null, 'intermediate', 'Classification', 'multiple_choice', 'Which of these is a mammal?', JSON.stringify([{ id: 'a', text: 'Eagle', is_correct: 0 }, { id: 'b', text: 'Bat', is_correct: 1 }, { id: 'c', text: 'Crocodile', is_correct: 0 }]), 'b', 'Bats are mammals; they have fur and feed their young with milk.');

// --- Sample Quiz: Jiggle Your Mind (Mathematics Grade 6) ---
const quizId = 'seed-quiz-math6';
db.prepare(
  `INSERT OR REPLACE INTO quizzes (id, title, subject_id, grade_id, strand_id, difficulty, exam_mode, timer_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
).run(quizId, 'Mathematics Quick Quiz - Grade 6', subjectIds.MATH, gradeIds['Grade 6'], 'seed-strand-num', 'basic', 'topic_quiz', 60);

// Quiz questions with options (MCQ + true/false)
const q1Id = 'seed-q1';
db.prepare(
  `INSERT OR REPLACE INTO quiz_questions (id, quiz_id, question_text, question_type, sort_order, explanation) VALUES (?, ?, ?, ?, ?, ?)`
).run(q1Id, quizId, 'What is 12 × 8?', 'multiple_choice', 1, '12 × 8 = 96. You can think of it as (10 × 8) + (2 × 8) = 80 + 16 = 96.');

const opts1 = [
  { id: randomUUID(), text: '86', correct: 0 },
  { id: randomUUID(), text: '96', correct: 1 },
  { id: randomUUID(), text: '106', correct: 0 },
  { id: randomUUID(), text: '84', correct: 0 },
];
opts1.forEach((o, i) => {
  db.prepare('INSERT OR REPLACE INTO quiz_options (id, question_id, option_text, is_correct, sort_order) VALUES (?, ?, ?, ?, ?)').run(o.id, q1Id, o.text, o.correct, i + 1);
});

const q2Id = 'seed-q2';
db.prepare(
  `INSERT OR REPLACE INTO quiz_questions (id, quiz_id, question_text, question_type, sort_order, explanation) VALUES (?, ?, ?, ?, ?, ?)`
).run(q2Id, quizId, 'True or False: 15 is a prime number.', 'true_false', 2, '15 = 3 × 5, so it is not prime. Prime numbers have exactly two factors: 1 and themselves.');

const opts2 = [
  { id: randomUUID(), text: 'True', correct: 0 },
  { id: randomUUID(), text: 'False', correct: 1 },
];
opts2.forEach((o, i) => {
  db.prepare('INSERT OR REPLACE INTO quiz_options (id, question_id, option_text, is_correct, sort_order) VALUES (?, ?, ?, ?, ?)').run(o.id, q2Id, o.text, o.correct, i + 1);
});

const q3Id = 'seed-q3';
db.prepare(
  `INSERT OR REPLACE INTO quiz_questions (id, quiz_id, question_text, question_type, sort_order, explanation) VALUES (?, ?, ?, ?, ?, ?)`
).run(q3Id, quizId, 'Which fraction is equivalent to 3/4?', 'multiple_choice', 3, '3/4 = 6/8 = 9/12. Multiplying numerator and denominator by the same number gives an equivalent fraction.');

const opts3 = [
  { id: randomUUID(), text: '6/8', correct: 1 },
  { id: randomUUID(), text: '2/3', correct: 0 },
  { id: randomUUID(), text: '5/6', correct: 0 },
  { id: randomUUID(), text: '1/2', correct: 0 },
];
opts3.forEach((o, i) => {
  db.prepare('INSERT OR REPLACE INTO quiz_options (id, question_id, option_text, is_correct, sort_order) VALUES (?, ?, ?, ?, ?)').run(o.id, q3Id, o.text, o.correct, i + 1);
});

// --- Second quiz: English ---
const quiz2Id = 'seed-quiz-eng6';
db.prepare(
  `INSERT OR REPLACE INTO quizzes (id, title, subject_id, grade_id, strand_id, difficulty, exam_mode, timer_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
).run(quiz2Id, 'English Grammar - Grade 6', subjectIds.ENG, gradeIds['Grade 6'], null, 'basic', 'topic_quiz', 45);

const q4Id = 'seed-q4';
db.prepare(
  `INSERT OR REPLACE INTO quiz_questions (id, quiz_id, question_text, question_type, sort_order, explanation) VALUES (?, ?, ?, ?, ?, ?)`
).run(q4Id, quiz2Id, 'Choose the correct past tense of "go".', 'multiple_choice', 1, 'The past tense of "go" is "went". It is an irregular verb.');
const opts4 = [
  { id: randomUUID(), text: 'goed', correct: 0 },
  { id: randomUUID(), text: 'went', correct: 1 },
  { id: randomUUID(), text: 'gone', correct: 0 },
  { id: randomUUID(), text: 'going', correct: 0 },
];
opts4.forEach((o, i) => {
  db.prepare('INSERT OR REPLACE INTO quiz_options (id, question_id, option_text, is_correct, sort_order) VALUES (?, ?, ?, ?, ?)').run(o.id, q4Id, o.text, o.correct, i + 1);
});

const q5Id = 'seed-q5';
db.prepare(
  `INSERT OR REPLACE INTO quiz_questions (id, quiz_id, question_text, question_type, sort_order, explanation) VALUES (?, ?, ?, ?, ?, ?)`
).run(q5Id, quiz2Id, 'True or False: "Their" can mean "belonging to them".', 'true_false', 2, '"Their" is a possessive determiner meaning belonging to or associated with them.');
const opts5 = [
  { id: randomUUID(), text: 'True', correct: 1 },
  { id: randomUUID(), text: 'False', correct: 0 },
];
opts5.forEach((o, i) => {
  db.prepare('INSERT OR REPLACE INTO quiz_options (id, question_id, option_text, is_correct, sort_order) VALUES (?, ?, ?, ?, ?)').run(o.id, q5Id, o.text, o.correct, i + 1);
});

// --- Written Exam: Sitting Exam (Science Grade 7) ---
const examId = 'seed-exam-sci7';
db.prepare(
  `INSERT OR REPLACE INTO written_exams (id, title, subject_id, grade_id, strand_id, duration_minutes, one_attempt_only, exam_mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
).run(examId, 'Science End of Term 2 - Grade 7', subjectIds.SCI, gradeIds['Grade 7'], 'seed-strand-living', 90, 1, 'end_of_term');

const wq1Id = 'seed-wq1';
const wq2Id = 'seed-wq2';
db.prepare('INSERT OR REPLACE INTO written_questions (id, exam_id, question_text, max_marks, sort_order) VALUES (?, ?, ?, ?, ?)').run(wq1Id, examId, 'Explain the water cycle and the role of evaporation and condensation.', 15, 1);
db.prepare('INSERT OR REPLACE INTO written_questions (id, exam_id, question_text, max_marks, sort_order) VALUES (?, ?, ?, ?, ?)').run(wq2Id, examId, 'Describe two ways in which human activities affect the environment. Suggest one way to reduce negative impact.', 15, 2);

// --- Engagement: badges, daily challenge, weekly quiz ---
const badgeList = [
  { id: 'badge-first-quiz', name: 'First Lesson Completed', description: 'Complete your first quiz', icon: 'star', criteria_json: JSON.stringify({ type: 'first_quiz' }), xp_reward: 50 },
  { id: 'badge-streak-7', name: 'Quiz Streak 7 Days', description: 'Learn 7 days in a row', icon: 'flame', criteria_json: JSON.stringify({ type: 'quiz_streak', days: 7 }), xp_reward: 100 },
  { id: 'badge-score-90', name: '90% Score Achiever', description: 'Score 90% or higher on a quiz', icon: 'trophy', criteria_json: JSON.stringify({ type: 'score_90' }), xp_reward: 75 },
  { id: 'badge-quizzes-10', name: '10 Topics Finished', description: 'Complete 10 quizzes', icon: 'book', criteria_json: JSON.stringify({ type: 'quizzes_10', count: 10 }), xp_reward: 150 },
  { id: 'badge-first-exam', name: 'First Exam', description: 'Submit your first written exam', icon: 'file-check', criteria_json: JSON.stringify({ type: 'first_exam' }), xp_reward: 80 },
];
badgeList.forEach((b) => {
  db.prepare(
    'INSERT OR REPLACE INTO badges (id, name, description, icon, criteria_json, xp_reward) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(b.id, b.name, b.description, b.icon, b.criteria_json, b.xp_reward);
});

const today = new Date().toISOString().slice(0, 10);
const startOfYear = new Date(new Date().getFullYear(), 0, 1);
const weekNum = Math.ceil(((Date.now() - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
const year = new Date().getFullYear();

db.prepare(
  `INSERT OR REPLACE INTO daily_challenges (id, subject_id, grade_id, quiz_id, title, date_active) VALUES (?, ?, ?, ?, ?, ?)`
).run('seed-daily-1', SUBJECT_MATH, GRADE_6, 'seed-quiz-math6', 'Daily Math Challenge - Grade 6', today);

db.prepare(
  `INSERT OR REPLACE INTO weekly_quizzes (id, subject_id, grade_id, quiz_id, title, week_number, year) VALUES (?, ?, ?, ?, ?, ?, ?)`
).run('seed-weekly-1', SUBJECT_MATH, GRADE_6, 'seed-quiz-math6', 'Weekly Math Quiz - Grade 6', weekNum, year);

// --- Question hints (step-by-step for seed quiz questions) ---
const hintRows = [
  { id: 'seed-h1', qId: 'seed-q1', step_order: 1, step_type: 'hint', content_text: 'Break 12 × 8 into (10 × 8) + (2 × 8).' },
  { id: 'seed-h2', qId: 'seed-q1', step_order: 2, step_type: 'hint', content_text: '10 × 8 = 80 and 2 × 8 = 16. Add them.' },
  { id: 'seed-h3', qId: 'seed-q1', step_order: 3, step_type: 'full_solution', content_text: '12 × 8 = (10 × 8) + (2 × 8) = 80 + 16 = 96.' },
  { id: 'seed-h4', qId: 'seed-q2', step_order: 1, step_type: 'hint', content_text: 'A prime number has exactly two factors: 1 and itself.' },
  { id: 'seed-h5', qId: 'seed-q2', step_order: 2, step_type: 'full_solution', content_text: '15 = 3 × 5, so 15 has factors 1, 3, 5, 15. So 15 is not prime. The answer is False.' },
  { id: 'seed-h6', qId: 'seed-q3', step_order: 1, step_type: 'hint', content_text: 'Equivalent fractions have the same value. Multiply or divide numerator and denominator by the same number.' },
  { id: 'seed-h7', qId: 'seed-q3', step_order: 2, step_type: 'full_solution', content_text: '3/4 = 6/8 (multiply top and bottom by 2). So 6/8 is equivalent to 3/4.' },
];
hintRows.forEach((h) => {
  db.prepare(
    `INSERT OR REPLACE INTO question_hints (id, question_entity_type, question_entity_id, step_order, step_type, content_text) VALUES (?, 'quiz_question', ?, ?, ?, ?)`
  ).run(h.id, h.qId, h.step_order, h.step_type, h.content_text);
});

// --- Term planner: terms + weeks per grade (Grade 6 & 7, 3 terms, 13 weeks each) ---
const gradeIdsForTerms = [GRADE_6, GRADE_7];
gradeIdsForTerms.forEach((gradeId) => {
  for (let t = 1; t <= 3; t++) {
    const termId = `seed-term-${gradeId}-${t}`;
    db.prepare(
      'INSERT OR REPLACE INTO terms (id, grade_id, name, term_number, sort_order) VALUES (?, ?, ?, ?, ?)'
    ).run(termId, gradeId, `Term ${t}`, t, t);
    for (let w = 1; w <= 13; w++) {
      const weekId = `seed-week-${termId}-${w}`;
      db.prepare(
        'INSERT OR REPLACE INTO term_weeks (id, term_id, week_number, title, sort_order) VALUES (?, ?, ?, ?, ?)'
      ).run(weekId, termId, w, `Week ${w}`, w);
    }
  }
});

// --- Timetable: default weekly slots for Grade 7 (Mon=1 .. Fri=5) ---
const DAYS = [
  { day: 1, name: 'Monday' },
  { day: 2, name: 'Tuesday' },
  { day: 3, name: 'Wednesday' },
  { day: 4, name: 'Thursday' },
  { day: 5, name: 'Friday' },
];
const timetableSlots = [
  { start: '08:00', end: '09:00', subjectId: SUBJECT_MATH, title: 'Numbers: Fractions', competency: 'Equivalent fractions, addition & subtraction' },
  { start: '09:00', end: '10:00', subjectId: SUBJECT_ENG, title: 'Comprehension & Grammar', competency: 'Reading fluency, inference' },
  { start: '10:00', end: '10:30', subjectId: null, title: 'Break', competency: null },
  { start: '10:30', end: '11:30', subjectId: SUBJECT_SCI, title: 'Living Things', competency: 'Classification, life processes' },
  { start: '11:30', end: '12:30', subjectId: SUBJECT_KIS, title: 'Kusoma na Kuandika', competency: 'Ufahamu na sarufi' },
  { start: '12:30', end: '13:30', subjectId: null, title: 'Lunch', competency: null },
  { start: '13:30', end: '14:30', subjectId: SUBJECT_SST, title: 'History & Citizenship', competency: 'Kenya history, rights' },
  { start: '14:30', end: '15:30', subjectId: SUBJECT_ART, title: 'Creative Arts', competency: 'Drawing, music, drama' },
];
DAYS.forEach(({ day }) => {
  let order = 0;
  timetableSlots.forEach((slot) => {
    if (!slot.subjectId) return;
    const id = `seed-tt-${GRADE_7}-${day}-${order}`;
    db.prepare(
      `INSERT OR REPLACE INTO timetable_slots (id, grade_id, day_of_week, start_time, end_time, subject_id, title, competency_hint, link_type, link_id, is_suggested, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', NULL, 0, ?)`
    ).run(id, GRADE_7, day, slot.start, slot.end, slot.subjectId, slot.title, slot.competency, order);
    order += 1;
  });
});
// Same for Grade 6
DAYS.forEach(({ day }) => {
  let order = 0;
  timetableSlots.forEach((slot) => {
    if (!slot.subjectId) return;
    const id = `seed-tt-${GRADE_6}-${day}-${order}`;
    db.prepare(
      `INSERT OR REPLACE INTO timetable_slots (id, grade_id, day_of_week, start_time, end_time, subject_id, title, competency_hint, link_type, link_id, is_suggested, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', NULL, 0, ?)`
    ).run(id, GRADE_6, day, slot.start, slot.end, slot.subjectId, slot.title, slot.competency, order);
    order += 1;
  });
});

// --- Calendar: holidays + sample exam/quiz events (2025–2026) ---
const calendarEvents = [
  { id: 'cal-h1', grade_id: null, subject_id: null, title: 'New Year', event_type: 'holiday', date: '2025-01-01', start_time: null, end_time: null, entity_type: '', entity_id: null, description: 'Public holiday', term_id: null, competency_hint: null },
  { id: 'cal-h2', grade_id: null, subject_id: null, title: 'Good Friday', event_type: 'holiday', date: '2025-04-18', start_time: null, end_time: null, entity_type: '', entity_id: null, description: 'Public holiday', term_id: null, competency_hint: null },
  { id: 'cal-h3', grade_id: null, subject_id: null, title: 'Easter Monday', event_type: 'holiday', date: '2025-04-21', start_time: null, end_time: null, entity_type: '', entity_id: null, description: 'Public holiday', term_id: null, competency_hint: null },
  { id: 'cal-h4', grade_id: null, subject_id: null, title: 'Madaraka Day', event_type: 'holiday', date: '2025-06-01', start_time: null, end_time: null, entity_type: '', entity_id: null, description: 'Public holiday', term_id: null, competency_hint: null },
  { id: 'cal-h5', grade_id: null, subject_id: null, title: 'Eid ul-Adha', event_type: 'holiday', date: '2025-06-07', start_time: null, end_time: null, entity_type: '', entity_id: null, description: 'Public holiday', term_id: null, competency_hint: null },
  { id: 'cal-h6', grade_id: null, subject_id: null, title: 'Kenyatta Day', event_type: 'holiday', date: '2025-10-20', start_time: null, end_time: null, entity_type: '', entity_id: null, description: 'Public holiday', term_id: null, competency_hint: null },
  { id: 'cal-e1', grade_id: GRADE_7, subject_id: SUBJECT_MATH, title: 'Math End of Term 1 Assessment', event_type: 'exam', date: '2025-03-15', start_time: '09:00', end_time: '11:00', entity_type: 'written_exam', entity_id: null, description: 'Grade 7 Mathematics', term_id: null, competency_hint: 'Numbers, Algebra' },
  { id: 'cal-e2', grade_id: GRADE_7, subject_id: SUBJECT_ENG, title: 'English Continuous Assessment', event_type: 'quiz', date: '2025-02-28', start_time: '10:00', end_time: null, entity_type: 'quiz', entity_id: null, description: 'Comprehension & Grammar', term_id: null, competency_hint: null },
  { id: 'cal-e3', grade_id: GRADE_7, subject_id: null, title: 'Term 1 Ends', event_type: 'event', date: '2025-04-04', start_time: null, end_time: null, entity_type: '', entity_id: null, description: 'School closes', term_id: null, competency_hint: null },
  { id: 'cal-e4', grade_id: GRADE_7, subject_id: null, title: 'Term 2 Opens', event_type: 'event', date: '2025-05-05', start_time: null, end_time: null, entity_type: '', entity_id: null, description: 'School opens', term_id: null, competency_hint: null },
];
calendarEvents.forEach((e) => {
  db.prepare(
    `INSERT OR REPLACE INTO calendar_events (id, grade_id, subject_id, title, event_type, date, start_time, end_time, entity_type, entity_id, description, term_id, competency_hint)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(e.id, e.grade_id, e.subject_id, e.title, e.event_type, e.date, e.start_time, e.end_time, e.entity_type, e.entity_id ?? null, e.description, e.term_id, e.competency_hint);
});

db.close();
console.log('Seed completed: Grade 1–9, subjects, strands, library, question bank, quizzes, written exam, badges, daily/weekly, terms & weeks, timetable, calendar.');
