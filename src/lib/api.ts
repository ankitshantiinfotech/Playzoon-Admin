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
  withCredentials: true, // sends adminRefreshToken HTTP-only cookie automatically
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

// ── Response interceptor — 401 → refresh → retry ──────────────────
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

    // Do not attempt refresh for:
    //  - non-401 errors
    //  - requests that already retried (_retry flag)
    //  - auth endpoints (avoids infinite refresh loops)
    const isAuthEndpoint = req.url?.includes('/auth/');
    if (error.response?.status !== 401 || req._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    // Queue concurrent requests while a refresh is already in progress
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
      // refreshAccessToken returned null (refresh token expired) — session is dead
      processQueue(new Error('Session expired'), null);
      return Promise.reject(error);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Only force-logout on a definitive auth rejection from the refresh endpoint.
      // Do NOT logout on network errors, timeouts, or server errors — those are transient.
      const status = (refreshError as AxiosError)?.response?.status;
      if (status === 401 || status === 403) {
        authState().logout();
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
