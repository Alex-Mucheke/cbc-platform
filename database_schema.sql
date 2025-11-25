-- CBC Learn Platform - Complete Database Schema
-- Run this entire script in your Supabase SQL Editor

-- ============================================
-- STEP 1: Create Custom Types
-- ============================================

CREATE TYPE user_type AS ENUM ('student', 'teacher', 'parent', 'admin');
CREATE TYPE resource_type AS ENUM ('textbook', 'teacher_guide', 'activity_book', 'reader', 'video', 'audio');
CREATE TYPE assessment_type AS ENUM ('exam', 'quiz', 'assignment', 'mock', 'past_paper');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'short_answer', 'essay', 'matching');
CREATE TYPE difficulty_level AS ENUM ('basic', 'intermediate', 'advanced');
CREATE TYPE competency_level AS ENUM ('exceeding', 'meeting', 'approaching', 'below');
CREATE TYPE assessment_status AS ENUM ('in_progress', 'completed', 'graded');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE event_type AS ENUM ('exam', 'assignment', 'holiday', 'meeting', 'other');

-- ============================================
-- STEP 2: Create Tables
-- ============================================

-- User profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type user_type NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  phone_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Parents
CREATE TABLE IF NOT EXISTS parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  id_number text UNIQUE,
  relationship text,
  created_at timestamptz DEFAULT now()
);

-- Teachers
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  employee_number text UNIQUE,
  specialization text[],
  qualification text,
  subjects_taught text[],
  created_at timestamptz DEFAULT now()
);

-- Students
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  grade_level text NOT NULL,
  admission_number text UNIQUE,
  date_of_birth date,
  parent_id uuid REFERENCES parents(id),
  total_xp integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  badges jsonb DEFAULT '[]'::jsonb,
  learning_goals jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  grade_levels text[],
  description text,
  created_at timestamptz DEFAULT now()
);

-- Strands
CREATE TABLE IF NOT EXISTS strands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Sub-strands
CREATE TABLE IF NOT EXISTS sub_strands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strand_id uuid NOT NULL REFERENCES strands(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  learning_outcomes jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Library resources
CREATE TABLE IF NOT EXISTS library_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  resource_type resource_type NOT NULL,
  subject_id uuid REFERENCES subjects(id),
  grade_level text NOT NULL,
  strand_id uuid REFERENCES strands(id),
  sub_strand_id uuid REFERENCES sub_strands(id),
  file_url text,
  preview_url text,
  cover_image_url text,
  description text,
  author text,
  publisher text,
  pages integer,
  downloads_count integer DEFAULT 0,
  views_count integer DEFAULT 0,
  uploaded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Assessments
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  assessment_type assessment_type NOT NULL,
  subject_id uuid NOT NULL REFERENCES subjects(id),
  grade_level text NOT NULL,
  strand_id uuid REFERENCES strands(id),
  difficulty_level difficulty_level DEFAULT 'intermediate',
  total_marks integer NOT NULL,
  duration_minutes integer,
  term text,
  year integer,
  created_by uuid REFERENCES teachers(id),
  is_published boolean DEFAULT false,
  instructions text,
  created_at timestamptz DEFAULT now()
);

-- Questions
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type question_type NOT NULL,
  options jsonb,
  correct_answer text,
  marks integer NOT NULL,
  explanation text,
  order_number integer NOT NULL,
  competency_tags text[],
  created_at timestamptz DEFAULT now()
);

-- Student assessments
CREATE TABLE IF NOT EXISTS student_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  score numeric,
  percentage numeric,
  answers jsonb DEFAULT '{}'::jsonb,
  feedback text,
  status assessment_status DEFAULT 'in_progress',
  time_spent_minutes integer
);

-- Student performance
CREATE TABLE IF NOT EXISTS student_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id),
  strand_id uuid REFERENCES strands(id),
  term text NOT NULL,
  year integer NOT NULL,
  competency_level competency_level,
  marks_obtained numeric,
  total_marks numeric,
  teacher_comment text,
  areas_of_strength text[],
  areas_for_improvement text[],
  updated_at timestamptz DEFAULT now()
);

-- Schemes of work
CREATE TABLE IF NOT EXISTS schemes_of_work (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id),
  grade_level text NOT NULL,
  term text NOT NULL,
  year integer NOT NULL,
  content jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Lesson plans
CREATE TABLE IF NOT EXISTS lesson_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  scheme_id uuid REFERENCES schemes_of_work(id),
  subject_id uuid NOT NULL REFERENCES subjects(id),
  grade_level text NOT NULL,
  strand_id uuid NOT NULL REFERENCES strands(id),
  sub_strand_id uuid REFERENCES sub_strands(id),
  lesson_title text NOT NULL,
  date date NOT NULL,
  duration_minutes integer,
  learning_outcomes text[],
  materials_needed text[],
  introduction text,
  activities jsonb,
  assessment_method text,
  reflection text,
  created_at timestamptz DEFAULT now()
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  target_audience text[],
  priority priority_level DEFAULT 'medium',
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Discussion threads
CREATE TABLE IF NOT EXISTS discussion_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  subject_id uuid REFERENCES subjects(id),
  grade_level text,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_solved boolean DEFAULT false,
  votes integer DEFAULT 0,
  views integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Discussion replies
CREATE TABLE IF NOT EXISTS discussion_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES discussion_threads(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  votes integer DEFAULT 0,
  is_best_answer boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Badges
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon_url text,
  criteria jsonb NOT NULL,
  xp_reward integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Student badges
CREATE TABLE IF NOT EXISTS student_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(student_id, badge_id)
);

-- Timetables
CREATE TABLE IF NOT EXISTS timetables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  grade_level text NOT NULL,
  subject_id uuid NOT NULL REFERENCES subjects(id),
  day_of_week text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  term text NOT NULL,
  year integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Calendar events
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type event_type NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  target_audience text[],
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- STEP 3: Create Indexes
-- ============================================

CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_students_grade_level ON students(grade_level);
CREATE INDEX idx_students_parent_id ON students(parent_id);
CREATE INDEX idx_library_resources_subject_grade ON library_resources(subject_id, grade_level);
CREATE INDEX idx_assessments_subject_grade ON assessments(subject_id, grade_level);
CREATE INDEX idx_student_assessments_student ON student_assessments(student_id);
CREATE INDEX idx_student_performance_student_subject ON student_performance(student_id, subject_id);
CREATE INDEX idx_discussion_threads_subject ON discussion_threads(subject_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);

-- ============================================
-- STEP 4: Enable Row Level Security
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE strands ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_strands ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE schemes_of_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Create RLS Policies
-- ============================================

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Students policies
CREATE POLICY "Students can view own data"
  ON students FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM parents p WHERE p.id = students.parent_id AND p.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type IN ('teacher', 'admin'))
  );

CREATE POLICY "Teachers and admins can update students"
  ON students FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type IN ('teacher', 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type IN ('teacher', 'admin')));

-- Teachers policies
CREATE POLICY "Teachers can view all teachers"
  ON teachers FOR SELECT TO authenticated USING (true);

-- Parents policies
CREATE POLICY "Parents can view own data"
  ON parents FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Subjects policies
CREATE POLICY "Anyone can view subjects"
  ON subjects FOR SELECT TO authenticated USING (true);

-- Strands policies
CREATE POLICY "Anyone can view strands"
  ON strands FOR SELECT TO authenticated USING (true);

-- Sub-strands policies
CREATE POLICY "Anyone can view sub_strands"
  ON sub_strands FOR SELECT TO authenticated USING (true);

-- Library resources policies
CREATE POLICY "Anyone can view published resources"
  ON library_resources FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers can upload resources"
  ON library_resources FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type IN ('teacher', 'admin')));

-- Assessments policies
CREATE POLICY "Students can view published assessments"
  ON assessments FOR SELECT TO authenticated
  USING (
    is_published = true OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type IN ('teacher', 'admin'))
  );

CREATE POLICY "Teachers can manage assessments"
  ON assessments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM teachers WHERE teachers.user_id = auth.uid()));

CREATE POLICY "Teachers can update own assessments"
  ON assessments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.id = assessments.created_by AND teachers.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM teachers WHERE teachers.id = assessments.created_by AND teachers.user_id = auth.uid()));

-- Questions policies
CREATE POLICY "Users can view questions of accessible assessments"
  ON questions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assessments
      WHERE assessments.id = questions.assessment_id AND (
        assessments.is_published = true OR
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type IN ('teacher', 'admin'))
      )
    )
  );

-- Student assessments policies
CREATE POLICY "Students can view own assessment attempts"
  ON student_assessments FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM students WHERE students.id = student_assessments.student_id AND students.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM students s JOIN parents p ON p.id = s.parent_id WHERE s.id = student_assessments.student_id AND p.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type IN ('teacher', 'admin'))
  );

CREATE POLICY "Students can create own assessment attempts"
  ON student_assessments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM students WHERE students.id = student_assessments.student_id AND students.user_id = auth.uid()));

CREATE POLICY "Students and teachers can update assessment attempts"
  ON student_assessments FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM students WHERE students.id = student_assessments.student_id AND students.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type IN ('teacher', 'admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students WHERE students.id = student_assessments.student_id AND students.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type IN ('teacher', 'admin'))
  );

-- Student performance policies
CREATE POLICY "Students and parents can view performance"
  ON student_performance FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM students WHERE students.id = student_performance.student_id AND students.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM students s JOIN parents p ON p.id = s.parent_id WHERE s.id = student_performance.student_id AND p.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type IN ('teacher', 'admin'))
  );

-- Messages policies
CREATE POLICY "Users can view sent and received messages"
  ON messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Recipients can update message read status"
  ON messages FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Discussion threads policies
CREATE POLICY "Anyone can view discussion threads"
  ON discussion_threads FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create threads"
  ON discussion_threads FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

-- Discussion replies policies
CREATE POLICY "Anyone can view replies"
  ON discussion_replies FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create replies"
  ON discussion_replies FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

-- Badges policies
CREATE POLICY "Anyone can view badges"
  ON badges FOR SELECT TO authenticated USING (true);

-- Student badges policies
CREATE POLICY "Students can view own badges"
  ON student_badges FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM students WHERE students.id = student_badges.student_id AND students.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type IN ('teacher', 'admin'))
  );

-- ============================================
-- STEP 6: Insert Sample Data
-- ============================================

-- Sample subjects
INSERT INTO subjects (name, code, grade_levels, description) VALUES
  ('Mathematics', 'MATH', ARRAY['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'], 'Core mathematics curriculum'),
  ('English', 'ENG', ARRAY['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'], 'English language and literature'),
  ('Kiswahili', 'KIS', ARRAY['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'], 'Kiswahili language'),
  ('Science', 'SCI', ARRAY['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'], 'Science and technology'),
  ('Social Studies', 'SST', ARRAY['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'], 'Social studies and citizenship'),
  ('Creative Arts', 'ART', ARRAY['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'], 'Creative arts and sports')
ON CONFLICT (code) DO NOTHING;

-- Sample badges
INSERT INTO badges (name, description, criteria, xp_reward) VALUES
  ('First Steps', 'Complete your first lesson', '{"type": "lesson_completion", "count": 1}', 50),
  ('Math Wizard', 'Score 90% or higher in 5 math assessments', '{"type": "subject_performance", "subject": "Mathematics", "threshold": 90, "count": 5}', 200),
  ('Perfect Score', 'Achieve 100% in any assessment', '{"type": "perfect_score"}', 150),
  ('Study Streak', 'Maintain a 7-day learning streak', '{"type": "streak", "days": 7}', 100),
  ('Bookworm', 'Read 10 library resources', '{"type": "resources_read", "count": 10}', 120),
  ('Quiz Master', 'Complete 20 quizzes', '{"type": "quiz_completion", "count": 20}', 180)
ON CONFLICT DO NOTHING;

-- Database setup complete!
-- You can now create user accounts through the application's signup page.
