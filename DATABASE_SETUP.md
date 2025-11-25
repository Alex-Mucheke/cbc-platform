# CBC Learn Platform - Database Setup Guide

## Database Schema Overview

The CBC Learn platform uses a comprehensive PostgreSQL database schema designed for Kenya's Competency-Based Curriculum. The schema supports students, teachers, parents, and administrators.

## Core Tables

### 1. User Management
- **profiles** - Extended user information for all user types
- **students** - Student-specific data with gamification features
- **teachers** - Teacher profiles and credentials
- **parents** - Parent information and relationships

### 2. Academic Structure
- **subjects** - CBC subjects (Mathematics, English, Science, etc.)
- **strands** - Subject strands
- **sub_strands** - Sub-strands with learning outcomes

### 3. Digital Library
- **library_resources** - Textbooks, activity books, teacher guides, readers

### 4. Assessment System
- **assessments** - Exams, quizzes, assignments, past papers
- **questions** - Assessment questions with auto-marking
- **student_assessments** - Student attempts and scores

### 5. Performance Tracking
- **student_performance** - CBC competency-based performance metrics

### 6. Teacher Tools
- **schemes_of_work** - Teacher planning documents
- **lesson_plans** - Detailed lesson plans

### 7. Communication
- **announcements** - Platform announcements
- **messages** - Direct messaging
- **discussion_threads** - Community Q&A
- **discussion_replies** - Thread replies

### 8. Gamification
- **badges** - Achievement badges
- **student_badges** - Earned badges

### 9. Calendar
- **timetables** - Class schedules
- **calendar_events** - Important dates

## Manual Database Setup

Since the Supabase MCP tools are not functioning, you'll need to manually create the database schema. Here's how:

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to the SQL Editor

### Step 2: Run the Migration

Copy and paste the SQL from `supabase/migrations/.keep` (or use the schema below):

```sql
-- Create custom types
CREATE TYPE user_type AS ENUM ('student', 'teacher', 'parent', 'admin');
CREATE TYPE resource_type AS ENUM ('textbook', 'teacher_guide', 'activity_book', 'reader', 'video', 'audio');
CREATE TYPE assessment_type AS ENUM ('exam', 'quiz', 'assignment', 'mock', 'past_paper');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'short_answer', 'essay', 'matching');
CREATE TYPE difficulty_level AS ENUM ('basic', 'intermediate', 'advanced');
CREATE TYPE competency_level AS ENUM ('exceeding', 'meeting', 'approaching', 'below');
CREATE TYPE assessment_status AS ENUM ('in_progress', 'completed', 'graded');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE event_type AS ENUM ('exam', 'assignment', 'holiday', 'meeting', 'other');

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type user_type NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  phone_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Continue with all other tables...
```

### Step 3: Insert Sample Data

#### Sample Subjects
```sql
INSERT INTO subjects (name, code, grade_levels, description) VALUES
  ('Mathematics', 'MATH', ARRAY['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'], 'Core mathematics curriculum'),
  ('English', 'ENG', ARRAY['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'], 'English language and literature'),
  ('Kiswahili', 'KIS', ARRAY['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'], 'Kiswahili language'),
  ('Science', 'SCI', ARRAY['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'], 'Science and technology'),
  ('Social Studies', 'SST', ARRAY['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'], 'Social studies'),
  ('Creative Arts', 'ART', ARRAY['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'], 'Creative arts and sports');
```

#### Sample Badges
```sql
INSERT INTO badges (name, description, icon_url, criteria, xp_reward) VALUES
  ('First Steps', 'Complete your first lesson', NULL, '{"type": "lesson_completion", "count": 1}', 50),
  ('Math Wizard', 'Score 90% or higher in 5 math assessments', NULL, '{"type": "subject_performance", "subject": "Mathematics", "threshold": 90, "count": 5}', 200),
  ('Perfect Score', 'Achieve 100% in any assessment', NULL, '{"type": "perfect_score"}', 150),
  ('Study Streak', 'Maintain a 7-day learning streak', NULL, '{"type": "streak", "days": 7}', 100);
```

## Security Notes

- All tables have Row Level Security (RLS) enabled
- Students can only view their own data
- Parents can view their children's data
- Teachers can manage their classes and materials
- Admins have full access

## Next Steps

1. Create user accounts through the signup page
2. For testing, you can manually insert records using SQL
3. All passwords are handled by Supabase Auth
4. File uploads for library resources will need to be configured in Supabase Storage

## Support

For issues with database setup, refer to:
- Supabase Documentation: https://supabase.com/docs
- Project GitHub Issues (when available)
