import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  Profile,
  getSession,
  getProfileFromSession,
  signInLocal,
  signUpLocal,
  signOutLocal,
  clearAllAuthStorage,
} from '../lib/auth';
import {
  hasBackend,
  clearToken,
  apiLogin,
  apiRegister,
  apiMe,
} from '../lib/api';

interface AuthContextType {
  user: { id: string; email: string } | null;
  session: { userId: string; email: string } | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, userType: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [session, setSession] = useState<{ userId: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('clear_auth') === '1') {
      clearAllAuthStorage();
      params.delete('clear_auth');
      const newSearch = params.toString();
      const url = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname;
      window.history.replaceState({}, '', url);
    }
    if (hasBackend()) {
      apiMe()
        .then((data) => {
          if (data) {
            setUser(data.user);
            setSession({ userId: data.user.id, email: data.user.email });
            setProfile(data.profile);
          } else {
            setUser(null);
            setSession(null);
            setProfile(null);
          }
        })
        .catch(() => {
          setUser(null);
          setSession(null);
          setProfile(null);
        })
        .finally(() => setLoading(false));
    } else {
      const s = getSession();
      setSession(s);
      if (s) {
        setUser({ id: s.userId, email: s.email });
        const p = getProfileFromSession();
        setProfile(p);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    if (hasBackend()) {
      const data = await apiLogin(email, password);
      setUser(data.user);
      setSession({ userId: data.user.id, email: data.user.email });
      setProfile(data.profile);
    } else {
      const p = await signInLocal(email, password);
      if (!p) throw new Error('Invalid email or password');
      setSession(getSession());
      setUser({ id: p.id, email });
      setProfile(p);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    userType: string
  ) => {
    if (hasBackend()) {
      const data = await apiRegister(email, password, fullName, userType);
      setUser(data.user);
      setSession({ userId: data.user.id, email: data.user.email });
      setProfile(data.profile);
    } else {
      const p = await signUpLocal(email, password, fullName, userType as Profile['user_type']);
      setSession(getSession());
      setUser({ id: p.id, email });
      setProfile(p);
    }
  };

  const signOut = async () => {
    if (hasBackend()) clearToken();
    else signOutLocal();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
