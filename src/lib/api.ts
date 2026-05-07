// src/lib/api.ts
//
// Home.tsx and AuthContext.tsx (old version) import from here.
// We redirect everything to the real axios client so there is
// only ONE http layer in the entire app (same base URL, same token key).

import axiosClient from '@/api/client';

export const api = {
  get: (url: string) =>
    axiosClient.get(url).then(r => r.data),

  post: (url: string, body?: any) =>
    axiosClient.post(url, body).then(r => r.data),

  put: (url: string, body?: any) =>
    axiosClient.put(url, body).then(r => r.data),

  delete: (url: string) =>
    axiosClient.delete(url).then(r => r.data),
};
