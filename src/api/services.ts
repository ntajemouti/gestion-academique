/**
 * MyISTA API Services
 * One function per endpoint — import what you need in each page.
 */
import api from './client';

// ── Auth ─────────────────────────────────────────────────────
export const authApi = {
  me:             ()          => api.get('/auth/me'),
  updatePassword: (data: any) => api.put('/auth/password', data),
};

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => api.get('/dashboard'),
};

// ── Filières ──────────────────────────────────────────────────
export const filieresApi = {
  list:    (params?: any)             => api.get('/filieres', { params }),
  get:     (id: number)               => api.get(`/filieres/${id}`),
  create:  (data: any)                => api.post('/filieres', data),
  update:  (id: number, data: any)    => api.put(`/filieres/${id}`, data),
  delete:  (id: number)               => api.delete(`/filieres/${id}`),
};

// ── Modules ───────────────────────────────────────────────────
export const modulesApi = {
  list:   (params?: any)           => api.get('/modules', { params }),
  get:    (id: number)             => api.get(`/modules/${id}`),
  create: (data: any)              => api.post('/modules', data),
  update: (id: number, data: any)  => api.put(`/modules/${id}`, data),
  delete: (id: number)             => api.delete(`/modules/${id}`),
};

// ── Groupes ───────────────────────────────────────────────────
export const groupesApi = {
  list:   (params?: any)           => api.get('/groupes', { params }),
  get:    (id: number)             => api.get(`/groupes/${id}`),
  create: (data: any)              => api.post('/groupes', data),
  update: (id: number, data: any)  => api.put(`/groupes/${id}`, data),
  delete: (id: number)             => api.delete(`/groupes/${id}`),
};

// ── Users ─────────────────────────────────────────────────────
export const usersApi = {
  list:          (params?: any)           => api.get('/users', { params }),
  get:           (id: number)             => api.get(`/users/${id}`),
  create:        (data: any)              => api.post('/users', data),
  update:        (id: number, data: any)  => api.put(`/users/${id}`, data),
  delete:        (id: number)             => api.delete(`/users/${id}`),
  updateStatut:  (id: number, statut: string) => api.patch(`/users/${id}/statut`, { statut }),
  formateurs:    ()                       => api.get('/users/formateurs'),
  stagiaires:    (params?: any)           => api.get('/users/stagiaires', { params }),
};

// ── Clubs ─────────────────────────────────────────────────────
export const clubsApi = {
  list:         (params?: any)           => api.get('/clubs', { params }),
  get:          (id: number)             => api.get(`/clubs/${id}`),
  create:       (data: any)              => api.post('/clubs', data),
  update:       (id: number, data: any)  => api.put(`/clubs/${id}`, data),
  delete:       (id: number)             => api.delete(`/clubs/${id}`),
  join:         (id: number)             => api.post(`/clubs/${id}/join`),
  leave:        (id: number)             => api.delete(`/clubs/${id}/leave`),
  removeMember: (clubId: number, userId: number) =>
                  api.delete(`/clubs/${clubId}/members/${userId}`),
};

// ── Demandes ──────────────────────────────────────────────────
export const demandesApi = {
  list:    (params?: any)            => api.get('/demandes', { params }),
  get:     (id: number)              => api.get(`/demandes/${id}`),
  create:  (data: FormData)          => api.post('/demandes', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete:  (id: number)              => api.delete(`/demandes/${id}`),
  approve: (id: number)              => api.patch(`/demandes/${id}/approve`),
  reject:  (id: number, motif?: string) =>
             api.patch(`/demandes/${id}/reject`, { motif_rejet: motif }),
};

// ── Absences ──────────────────────────────────────────────────
export const absencesApi = {
  list:   (params?: any)           => api.get('/absences', { params }),
  stats:  (stagiaireId: number)    => api.get('/absences/stats', { params: { stagiaire_id: stagiaireId } }),
  get:    (id: number)             => api.get(`/absences/${id}`),
  create: (data: any)              => api.post('/absences', data),
  update: (id: number, data: any)  => api.put(`/absences/${id}`, data),
  delete: (id: number)             => api.delete(`/absences/${id}`),
};

// ── Notes ─────────────────────────────────────────────────────
export const notesApi = {
  list:     (params?: any)           => api.get('/notes', { params }),
  bulletin: (stagiaireId: number)    => api.get('/notes/bulletin', { params: { stagiaire_id: stagiaireId } }),
  get:      (id: number)             => api.get(`/notes/${id}`),
  create:   (data: any)              => api.post('/notes', data),
  update:   (id: number, data: any)  => api.put(`/notes/${id}`, data),
  delete:   (id: number)             => api.delete(`/notes/${id}`),
};

// ── Emplois du Temps ──────────────────────────────────────────
export const emploisApi = {
  list:   (params?: any)           => api.get('/emplois-du-temps', { params }),
  get:    (id: number)             => api.get(`/emplois-du-temps/${id}`),
  create: (data: any)              => api.post('/emplois-du-temps', data),
  update: (id: number, data: any)  => api.put(`/emplois-du-temps/${id}`, data),
  delete: (id: number)             => api.delete(`/emplois-du-temps/${id}`),
};
