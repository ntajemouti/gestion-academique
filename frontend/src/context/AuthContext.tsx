// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/api/client';

const TOKEN_KEY = 'myista_token';
const USER_KEY  = 'myista_current_user';

export interface AuthUser {
  id: number;
  matricule: string;
  prenom: string;
  nom: string;
  email: string;
  role: 'Administrateur' | 'Stagiaire' | 'Formateur';
  statut: 'Actif' | 'Inactif' | 'Congé';
  avatar?: string | null;
  specialite?: string | null;
  filiere_id?: number | null;
  groupe_id?: number | null;
  filiere?: { id: number; nom: string; code: string } | null;
  groupe?: { id: number; nom: string } | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  setUser: (u: AuthUser | null) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: AuthUser; message?: string }>;
  signup: (data: {
    prenom: string;
    nom: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then((res) => {
        const u: AuthUser = res.data;
        localStorage.setItem(USER_KEY, JSON.stringify(u));
        setUserState(u);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUserState(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const setUser = (u: AuthUser | null) => {
    setUserState(u);
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else   localStorage.removeItem(USER_KEY);
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; user?: AuthUser; message?: string }> => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user: u } = res.data as { token: string; user: AuthUser };
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      setUserState(u);
      return { success: true, user: u };
    } catch (err: any) {
      const message =
        err.response?.data?.message ??
        err.response?.data?.errors?.email?.[0] ??
        'Identifiants incorrects.';
      return { success: false, message };
    }
  };

  const signup = async (data: {
    prenom: string; nom: string; email: string;
    password: string; password_confirmation: string; role: string;
  }): Promise<boolean> => {
    try {
      const res = await api.post('/auth/register', data);
      const { token, user: u } = res.data as { token: string; user: AuthUser };
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      setUserState(u);
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUserState(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, setUser, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
