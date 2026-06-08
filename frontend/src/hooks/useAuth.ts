import { useAuth } from '@/context/AuthContext';

export { useAuth, AuthProvider } from '@/context/AuthContext';
export type { } from '@/context/AuthContext';
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

