import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import { useAdminAuthStore } from '@/stores/admin-auth.store';

function authState() {
  return useAdminAuthStore.getState();
}

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 30_000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor ────────────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (apiKey) config.headers.set('x-api-key', apiKey);

  const { accessToken } = authState();
  if (accessToken) config.headers.set('Authorization', `Bearer ${accessToken}`);

  const lang = localStorage.getItem('playzoon-admin-lang') || 'en';
  config.headers.set('Accept-Language', lang);

  return config;
});

// ── Response interceptor — 401 → refresh ───────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const req = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      !req._retry &&
      !req.url?.includes('/auth/')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              if (token) req.headers.set('Authorization', `Bearer ${token}`);
              resolve(api(req));
            },
            reject,
          });
        });
      }

      req._retry = true;
      isRefreshing = true;

      try {
        const newToken = await authState().refreshAccessToken();
        processQueue(null, newToken);
        if (newToken) {
          req.headers.set('Authorization', `Bearer ${newToken}`);
          return api(req);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        authState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
