import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ── Attach Bearer token to every request ─────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('myista_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Handle 401 globally → redirect to login ──────────────────
// Exceptions:
//  1. /auth/me  → AuthContext handles this itself (clears token, stays on page)
//  2. Public endpoints (filieres, clubs) → fail silently, no redirect
const PUBLIC_ENDPOINTS = ['/filieres', '/clubs', '/auth/register', '/auth/login'];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url: string = error.config?.url ?? '';

      const isMeCheck = url.includes('/auth/me');
      const isPublic  = PUBLIC_ENDPOINTS.some((p) => url.includes(p));

      if (!isMeCheck && !isPublic) {
        localStorage.removeItem('myista_token');
        localStorage.removeItem('myista_current_user');
        window.location.href = '/#/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;