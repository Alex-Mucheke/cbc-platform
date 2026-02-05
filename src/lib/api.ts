/**
 * Backend API client. Used when VITE_API_URL is set in .env.
 */

import type { Profile } from './auth';

const TOKEN_KEY = 'cbc_token';

function getBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL;
  if (!url || typeof url !== 'string') return '';
  return url.replace(/\/$/, '');
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function hasBackend(): boolean {
  return !!getBaseUrl();
}

export function clearToken(): void {
  setToken(null);
}

export async function apiRegister(
  email: string,
  password: string,
  fullName: string,
  userType: string
): Promise<{ user: { id: string; email: string }; profile: Profile; token: string }> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName, userType }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  setToken(data.token);
  return data;
}

export async function apiLogin(
  email: string,
  password: string
): Promise<{ user: { id: string; email: string }; profile: Profile; token: string }> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Invalid email or password');
  setToken(data.token);
  return data;
}

export async function apiMe(): Promise<{
  user: { id: string; email: string };
  profile: Profile;
} | null> {
  const base = getBaseUrl();
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${base}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    setToken(null);
    return null;
  }
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data;
}

/** Auth header for assessment API calls */
export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Fetch helper for API (uses base URL + auth when backend present) */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = getBaseUrl();
  if (!base) throw new Error('Backend not configured');
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers = { ...getAuthHeaders(), ...(init?.headers as Record<string, string>) };
  return fetch(url, { ...init, headers });
}

/** Jiggle Your Mind — list quizzes (optional filter: exam_mode, grade_id, subject_id) */
export async function apiQuizzesList(params?: { exam_mode?: string; grade_id?: string; subject_id?: string }): Promise<Array<{ id: string; title: string; subject_name: string; grade_name: string; difficulty: string; exam_mode?: string; timer_seconds: number }>> {
  const search = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
  const res = await apiFetch(`/api/quizzes${search ? `?${search}` : ''}`);
  if (!res.ok) throw new Error('Failed to load quizzes');
  return res.json();
}

/** Get quiz with questions and options */
export async function apiQuizGet(id: string) {
  const res = await apiFetch(`/api/quizzes/${id}`);
  if (!res.ok) throw new Error('Failed to load quiz');
  return res.json();
}

/** Start quiz attempt */
export async function apiQuizStartAttempt(quizId: string): Promise<{ attempt_id: string; timer_seconds: number; total_questions: number; question_ids: string[] }> {
  const res = await apiFetch(`/api/quizzes/${quizId}/attempts`, { method: 'POST' });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error || 'Failed to start attempt');
  }
  return res.json();
}

/** Submit one answer (instant feedback) */
export async function apiQuizSubmitAnswer(attemptId: string, questionId: string, optionId: string | null): Promise<{ is_correct: boolean; explanation: string | null }> {
  const res = await apiFetch(`/api/quizzes/attempts/${attemptId}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question_id: questionId, option_id: optionId }),
  });
  if (!res.ok) throw new Error('Failed to submit answer');
  return res.json();
}

/** Complete attempt (score summary) */
export async function apiQuizCompleteAttempt(attemptId: string): Promise<{ score: number; total_questions: number; time_taken_seconds: number }> {
  const res = await apiFetch(`/api/quizzes/attempts/${attemptId}/complete`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to complete');
  return res.json();
}

/** Sitting Exam — list written exams (optional filter: exam_mode, grade_id, subject_id) */
export async function apiWrittenExamsList(params?: { exam_mode?: string; grade_id?: string; subject_id?: string }): Promise<Array<{ id: string; title: string; subject_name: string; grade_name: string; duration_minutes: number; one_attempt_only: number; exam_mode?: string }>> {
  const search = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
  const res = await apiFetch(`/api/written-exams${search ? `?${search}` : ''}`);
  if (!res.ok) throw new Error('Failed to load exams');
  return res.json();
}

/** Get written exam with questions */
export async function apiWrittenExamGet(id: string) {
  const res = await apiFetch(`/api/written-exams/${id}`);
  if (!res.ok) throw new Error('Failed to load exam');
  return res.json();
}

/** Start written exam submission */
export async function apiWrittenExamStartSubmission(examId: string): Promise<{ submission_id: string; duration_minutes: number; question_ids: string[] }> {
  const res = await apiFetch(`/api/written-exams/${examId}/submissions`, { method: 'POST' });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error || 'Failed to start exam');
  }
  return res.json();
}

/** Autosave written answers */
export async function apiWrittenExamAutosave(submissionId: string, answers: Array<{ question_id: string; answer_text: string }>): Promise<void> {
  const res = await apiFetch(`/api/written-exams/submissions/${submissionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error('Failed to save');
}

/** Submit written exam */
export async function apiWrittenExamSubmit(submissionId: string): Promise<void> {
  const res = await apiFetch(`/api/written-exams/submissions/${submissionId}/submit`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to submit');
}

/** Get submission (student result or teacher marking) */
export async function apiWrittenExamGetSubmission(submissionId: string) {
  const res = await apiFetch(`/api/written-exams/submissions/${submissionId}`);
  if (!res.ok) throw new Error('Failed to load submission');
  return res.json();
}

/** Teacher: list submissions to mark */
export async function apiWrittenExamSubmissionsToMark(): Promise<Array<{ id: string; exam_title: string; student_name: string; status: string }>> {
  const res = await apiFetch('/api/written-exams/submissions/to-mark/list');
  if (!res.ok) throw new Error('Failed to load list');
  return res.json();
}

/** Teacher: save marks */
export async function apiWrittenExamMarkSubmission(submissionId: string, reviews: Array<{ question_id: string; marks_awarded: number; max_marks: number; comment?: string }>): Promise<void> {
  const res = await apiFetch(`/api/written-exams/submissions/${submissionId}/mark`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviews }),
  });
  if (!res.ok) throw new Error('Failed to save marks');
}

/** My written submissions */
export async function apiWrittenExamMySubmissions(): Promise<Array<{ id: string; exam_title: string; status: string; submitted_at: string | null }>> {
  const res = await apiFetch('/api/written-exams/submissions/mine');
  if (!res.ok) throw new Error('Failed to load submissions');
  return res.json();
}

// --- Library (CBC content: Grade → Subject → Strand → Books) ---
export async function apiLibraryList(params?: { grade_id?: string; subject_id?: string; strand_id?: string; resource_type?: string; q?: string; sort?: string }): Promise<Array<{ id: string; title: string; description?: string; resource_type: string; grade_name: string; subject_name: string; view_count: number; download_count: number; page_count?: number; author?: string }>> {
  const search = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
  const res = await apiFetch(`/api/library${search ? `?${search}` : ''}`);
  if (!res.ok) throw new Error('Failed to load library');
  return res.json();
}

export async function apiLibraryRecent(): Promise<Array<{ id: string; title: string; resource_type: string; grade_name: string; subject_name: string }>> {
  const res = await apiFetch('/api/library/recent');
  if (!res.ok) throw new Error('Failed to load');
  return res.json();
}

export async function apiLibraryMostUsed(): Promise<Array<{ id: string; title: string; resource_type: string; grade_name: string; subject_name: string; view_count: number; download_count: number }>> {
  const res = await apiFetch('/api/library/most-used');
  if (!res.ok) throw new Error('Failed to load');
  return res.json();
}

export async function apiLibraryTypes(): Promise<Array<{ id: string; label: string }>> {
  const res = await apiFetch('/api/library/types');
  if (!res.ok) throw new Error('Failed to load types');
  return res.json();
}

export async function apiGrades(): Promise<Array<{ id: string; name: string; sort_order: number }>> {
  const res = await apiFetch('/api/grades');
  if (!res.ok) throw new Error('Failed to load grades');
  return res.json();
}

export async function apiSubjects(): Promise<Array<{ id: string; name: string; code: string }>> {
  const res = await apiFetch('/api/subjects');
  if (!res.ok) throw new Error('Failed to load subjects');
  return res.json();
}

export async function apiStrands(params?: { grade_id?: string; subject_id?: string }): Promise<Array<{ id: string; name: string; grade_id: string; subject_id: string }>> {
  const search = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
  const res = await apiFetch(`/api/strands${search ? `?${search}` : ''}`);
  if (!res.ok) throw new Error('Failed to load strands');
  return res.json();
}

export async function apiSubStrands(strand_id: string): Promise<Array<{ id: string; strand_id: string; name: string; sort_order: number }>> {
  const res = await apiFetch(`/api/sub-strands?strand_id=${encodeURIComponent(strand_id)}`);
  if (!res.ok) throw new Error('Failed to load sub-strands');
  return res.json();
}

// --- Library upload (teacher/admin) ---
export async function apiLibraryCreate(body: {
  grade_id: string;
  subject_id: string;
  strand_id?: string;
  sub_strand_id?: string;
  resource_type: string;
  title: string;
  description?: string;
  tags?: string;
  author?: string;
  publisher?: string;
  page_count?: number;
  file_path?: string;
  file_type?: string;
  toc_json?: unknown;
  chapters_json?: unknown;
  marking_scheme_url?: string;
  examiner_notes?: string;
}): Promise<{ id: string; status: string }> {
  const res = await apiFetch('/api/library', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error((d as { error?: string }).error || 'Failed to create resource');
  }
  return res.json();
}

export async function apiLibraryMyUploads(): Promise<Array<{ id: string; title: string; resource_type: string; status: string; grade_name: string; subject_name: string; created_at: string }>> {
  const res = await apiFetch('/api/library/my-uploads');
  if (!res.ok) throw new Error('Failed to load my uploads');
  return res.json();
}

// --- Admin: content approval ---
export async function apiAdminLibraryPending(): Promise<Array<{
  id: string;
  title: string;
  resource_type: string;
  description: string | null;
  status: string;
  grade_name: string;
  subject_name: string;
  author: string | null;
  created_by_name: string | null;
  created_at: string;
}>> {
  const res = await apiFetch('/api/admin/library?status=pending');
  if (!res.ok) throw new Error('Failed to load pending');
  return res.json();
}

export async function apiAdminLibraryApprove(id: string): Promise<void> {
  const res = await apiFetch(`/api/admin/library/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'approved' }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error((d as { error?: string }).error || 'Failed to approve');
  }
}

// --- Engagement: summary, progress, badges, certificates, daily challenge ---
export interface EngagementSummary {
  streak: { current: number; longest: number; last_activity_date: string | null };
  xp: number;
  level: number;
  badges_count: number;
  progress: {
    quizzes_completed: number;
    exams_completed: number;
    total_activities: number;
    progress_percent: number;
  };
  recent_activity: Array<{
    type: string;
    title: string;
    subject_name: string;
    completed_at: string;
  }>;
}

export async function apiEngagementSummary(): Promise<EngagementSummary> {
  const res = await apiFetch('/api/engagement/summary');
  if (!res.ok) throw new Error('Failed to load summary');
  return res.json();
}

export async function apiEngagementProgress(): Promise<Array<{
  subject_id: string;
  subject_name: string;
  completed: number;
  total: number;
  percent: number;
}>> {
  const res = await apiFetch('/api/engagement/progress');
  if (!res.ok) throw new Error('Failed to load progress');
  return res.json();
}

export async function apiEngagementBadges(): Promise<Array<{
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  awarded_at: string;
}>> {
  const res = await apiFetch('/api/engagement/badges');
  if (!res.ok) throw new Error('Failed to load badges');
  return res.json();
}

export async function apiEngagementDailyChallenge(): Promise<{
  challenge: { id: string; title: string; quiz_id: string; subject_name: string; grade_name: string } | null;
  attempted: { score: number; total_questions: number; completed_at: string } | null;
}> {
  const res = await apiFetch('/api/engagement/daily-challenge');
  if (!res.ok) throw new Error('Failed to load daily challenge');
  return res.json();
}

export async function apiEngagementRecordDailyAttempt(
  challengeId: string,
  score: number,
  totalQuestions: number
): Promise<{ id: string }> {
  const res = await apiFetch('/api/engagement/daily-attempt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challenge_id: challengeId, score, total_questions: totalQuestions }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error((d as { error?: string }).error || 'Failed to record');
  }
  return res.json();
}
