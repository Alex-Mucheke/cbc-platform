/**
 * Local auth + shared types. No external backend — users and session
 * are stored in localStorage. Replace with your own API when ready.
 */

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

// --- Local storage auth (no Supabase) ---

const STORAGE_USERS = 'cbc_users';
const STORAGE_SESSION = 'cbc_session';

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  full_name: string;
  user_type: UserType;
  created_at: string;
  updated_at: string;
}

interface Session {
  userId: string;
  email: string;
}

async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(password)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredUsers(users: StoredUser[]) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession(session: Session | null) {
  if (session) {
    localStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_SESSION);
  }
}

function storedUserToProfile(u: StoredUser): Profile {
  return {
    id: u.id,
    user_type: u.user_type,
    full_name: u.full_name,
    created_at: u.created_at,
    updated_at: u.updated_at,
  };
}

export async function signInLocal(
  email: string,
  password: string
): Promise<Profile | null> {
  const e = email.trim().toLowerCase();
  const p = password;
  if (!e || !p) return null;

  const users = getStoredUsers();
  const stored = users.find((u) => u.email.toLowerCase() === e);
  if (!stored) return null;

  const hash = await hashPassword(p);
  if (stored.passwordHash !== hash) return null;

  const session: Session = { userId: stored.id, email: stored.email };
  setSession(session);
  return storedUserToProfile(stored);
}

export async function signUpLocal(
  email: string,
  password: string,
  fullName: string,
  userType: UserType
): Promise<Profile> {
  const users = getStoredUsers();
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) throw new Error('An account with this email already exists.');

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(password.trim());

  const stored: StoredUser = {
    id,
    email: email.trim().toLowerCase(),
    passwordHash,
    full_name: fullName.trim(),
    user_type: userType,
    created_at: now,
    updated_at: now,
  };

  setStoredUsers([...users, stored]);
  const session: Session = { userId: id, email: stored.email };
  setSession(session);
  return storedUserToProfile(stored);
}

export function signOutLocal(): void {
  setSession(null);
}

/** Clear all CBC auth from localStorage (token, local users, session) for a fresh sign-in. */
export function clearAllAuthStorage(): void {
  localStorage.removeItem('cbc_token');
  localStorage.removeItem(STORAGE_USERS);
  localStorage.removeItem(STORAGE_SESSION);
}

export function getProfileFromSession(): Profile | null {
  const session = getSession();
  if (!session) return null;

  const users = getStoredUsers();
  const stored = users.find((u) => u.id === session.userId);
  return stored ? storedUserToProfile(stored) : null;
}
