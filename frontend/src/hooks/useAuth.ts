// src/hooks/useAuth.ts
//
// Previously this was a standalone hook with its own useState — completely
// separate from AuthContext, so login() in Login.tsx would update one state
// while ProtectedRoute read a different, always-null state.
//
// Fix: this file now simply re-exports everything from AuthContext.
// All pages that import from '@/hooks/useAuth' get the SAME context state
// as App.tsx's ProtectedRoute which imports from '@/context/AuthContext'.

import { useAuth } from '@/context/AuthContext';

export { useAuth, AuthProvider } from '@/context/AuthContext';
export type { } from '@/context/AuthContext';

// ── Types re-exported so existing pages that import AuthUser from here still work ──
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

export default useAuth;

// ── Why this works ────────────────────────────────────────────────────────────
//
// Before:
//   Login.tsx          → import { useAuth } from '@/context/AuthContext'  → state A
//   ProtectedRoute     → import { useAuth } from '@/context/AuthContext'  → state A ✅
//   StagiaireDashboard → import { useAuth } from '@/hooks/useAuth'        → state B ❌
//   FormateurDashboard → import { useAuth } from '@/hooks/useAuth'        → state B ❌
//
// After:
//   Login.tsx          → import { useAuth } from '@/context/AuthContext'  → state A ✅
//   ProtectedRoute     → import { useAuth } from '@/context/AuthContext'  → state A ✅
//   StagiaireDashboard → import { useAuth } from '@/hooks/useAuth'        → state A ✅  (proxied)
//   FormateurDashboard → import { useAuth } from '@/hooks/useAuth'        → state A ✅  (proxied)
//
// No page needs to change its import path.
