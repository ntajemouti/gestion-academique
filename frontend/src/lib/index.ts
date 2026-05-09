export const ROUTE_PATHS = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_MODULES: '/admin/modules',
  ADMIN_FILIERES: '/admin/filieres',
  ADMIN_GROUPES: '/admin/groupes',
  ADMIN_UTILISATEURS: '/admin/utilisateurs',
  ADMIN_DEMANDES: '/admin/demandes',
  ADMIN_ABSENCES: '/admin/absences',
  ADMIN_NOTES: '/admin/notes',
  ADMIN_CLUBS: '/admin/clubs',
  ADMIN_EMPLOIS_DU_TEMPS: '/admin/emplois-du-temps',
  STAGIAIRE_DASHBOARD: '/stagiaire/dashboard',
  STAGIAIRE_EMPLOI_DU_TEMPS: '/stagiaire/emploi-du-temps',
  STAGIAIRE_NOTES: '/stagiaire/notes',
  STAGIAIRE_ABSENCES: '/stagiaire/absences',
  STAGIAIRE_CLUBS: '/stagiaire/clubs',
  STAGIAIRE_DEMANDES: '/stagiaire/demandes',
  FORMATEUR_DASHBOARD: '/formateur/dashboard',
  FORMATEUR_MES_MODULES: '/formateur/mes-modules',
  FORMATEUR_EMPLOI_DU_TEMPS: '/formateur/emploi-du-temps',
  FORMATEUR_ABSENCES_STAGIAIRES: '/formateur/absences-stagiaires',
  FORMATEUR_NOTES_STAGIAIRES: '/formateur/notes-stagiaires',
  FORMATEUR_DEMANDES: '/formateur/demandes',
  FILIERE_DETAIL: '/filiere/:id',
} as const;

export type UserRole = 'Administrateur' | 'Stagiaire' | 'Formateur';

export interface User {
  id: string;
  matricule: string;
  prenom: string;
  nom: string;
  email: string;
  role: UserRole;
  filiereId?: string;
  groupeId?: string;
  specialite?: string;
  statut: 'Actif' | 'Inactif' | 'Congé';
  avatar?: string;
}

export interface FiliereOption {
  nom: string;
  modulesSpécialité: string[];
  modulesRégionaux: string[];
}

export interface Filiere {
  id: string;
  code: string;
  nom: string;
  description: string;
  duree: number;
  niveau: string;
  statut: 'Actif' | 'Inactif';
  color: string;
  options: FiliereOption[];
  tronCCommun: string[];
}

export interface Module {
  id: string;
  code: string;
  nom: string;
  filiereId: string;
  formateurId: string;
  heuresParSemaine: number;
  coefficient: number;
}

export interface Groupe {
  id: string;
  nom: string;
  filiereId: string;
  niveau: string;
  annee: string;
  nombreStagiaires: number;
  formateurReferentId: string;
  statut: 'Actif' | 'Inactif';
}

export interface Club {
  id: string;
  nom: string;
  description: string;
  responsableId: string;
  nombreMembres: number;
  capaciteMax: number;
  statut: 'Actif' | 'Inactif';
  icon: string;
  membres: string[];
}

export interface Demande {
  id: string;
  reference: string;
  userId: string;
  type: 'Attestation de présence' | 'Certificat de scolarité' | 'Relevé de notes' | 'Autre';
  description: string;
  dateCreation: string;
  statut: 'En attente' | 'Approuvée' | 'Rejetée';
  fichier?: string;
}

export interface Absence {
  id: string;
  stagiaireId: string;
  moduleId: string;
  date: string;
  justifiee: boolean;
  motif?: string;
  formateurId: string;
}

export interface Note {
  id: string;
  stagiaireId: string;
  moduleId: string;
  note: number;
  coefficient: number;
  dateEvaluation: string;
  formateurId: string;
}

export interface EmploiDuTemps {
  id: string;
  jour: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi';
  heureDebut: string;
  heureFin: string;
  moduleId: string;
  formateurId: string;
  salle: string;
  groupeId: string;
}

export interface NavItem {
  label: string;
  path: string;
  icon: string;
}

export interface StatCard {
  label: string;
  value: string | number;
  trend?: string;
  icon: string;
  color: string;
}

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const calculateNotePonderee = (note: number, coefficient: number): number => {
  return note * coefficient;
};

export const calculateMoyenne = (notes: Note[]): number => {
  if (notes.length === 0) return 0;
  const totalPondere = notes.reduce((sum, n) => sum + calculateNotePonderee(n.note, n.coefficient), 0);
  const totalCoefficients = notes.reduce((sum, n) => sum + n.coefficient, 0);
  return totalCoefficients > 0 ? totalPondere / totalCoefficients : 0;
};

export const getMention = (moyenne: number): string => {
  if (moyenne >= 16) return 'Très Bien';
  if (moyenne >= 14) return 'Bien';
  if (moyenne >= 12) return 'Assez Bien';
  if (moyenne >= 10) return 'Passable';
  return 'Insuffisant';
};

export const getNoteColor = (note: number): string => {
  if (note >= 12) return 'text-green-600';
  if (note >= 10) return 'text-yellow-600';
  return 'text-red-600';
};

export const getStatusBadgeColor = (statut: string): string => {
  switch (statut) {
    case 'Actif':
    case 'Approuvée':
      return 'bg-green-100 text-green-800';
    case 'Inactif':
    case 'Rejetée':
      return 'bg-red-100 text-red-800';
    case 'En attente':
      return 'bg-yellow-100 text-yellow-800';
    case 'Congé':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
