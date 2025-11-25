import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserType = 'student' | 'teacher' | 'parent' | 'admin';

export interface Profile {
  id: string;
  user_type: UserType;
  full_name: string;
  avatar_url?: string;
  phone_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  user_id: string;
  grade_level: string;
  admission_number?: string;
  date_of_birth?: string;
  parent_id?: string;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  badges: any[];
  learning_goals: any[];
}

export interface Teacher {
  id: string;
  user_id: string;
  employee_number?: string;
  specialization?: string[];
  qualification?: string;
  subjects_taught?: string[];
}

export interface Parent {
  id: string;
  user_id: string;
  id_number?: string;
  relationship?: string;
}
