// src/hooks/useAuth.ts
// Re-exports everything from AuthContext so both import paths
// point to the exact same state — no page needs to change its import.
export { useAuth, AuthProvider } from '@/context/AuthContext';
export type { AuthUser } from '@/context/AuthContext';
export { useAuth as default } from '@/context/AuthContext';
