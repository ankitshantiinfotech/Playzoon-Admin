import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

export interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  permissions: string[];
  avatar_url: string | null;
}

interface AdminAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  logout: () => void;
  setUser: (user: AdminUser) => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data: resp } = await api.post('/admin/auth/login', { email, password });
          const payload = resp.data || resp;
          const admin = payload.admin || payload.user;
          set({
            accessToken: payload.access_token,
            // Store refresh token for body-based fallback (cookie is primary via withCredentials)
            refreshToken: payload.refresh_token || null,
            user: admin ? {
              id: admin.id,
              first_name: admin.first_name || admin.full_name?.split(' ')[0] || '',
              last_name: admin.last_name || admin.full_name?.split(' ').slice(1).join(' ') || '',
              email: admin.email,
              role: admin.is_super ? 'Super Admin' : (admin.role || 'Admin'),
              permissions: admin.permissions || [],
              avatar_url: admin.avatar_url || admin.profile_photo_url || null,
            } : null,
            isAuthenticated: true,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      forgotPassword: async (email) => {
        await api.post('/admin/auth/forgot-password', { email });
      },

      resetPassword: async (token, password) => {
        await api.post('/admin/auth/reset-password', { token, password });
      },

      /**
       * Calls the refresh-token endpoint.
       * The adminRefreshToken HTTP-only cookie is sent automatically via withCredentials.
       * The stored refreshToken is also sent in the body as a fallback.
       *
       * IMPORTANT: This function throws on failure — it does NOT call logout().
       * The Axios response interceptor is responsible for deciding whether to logout
       * (only on 401/403 from this endpoint, not on network errors or 5xx).
       */
      refreshAccessToken: async () => {
        const { refreshToken } = get();
        // Cookie (adminRefreshToken) is the primary mechanism via withCredentials.
        // Send stored token in body as fallback for environments where cookies are blocked.
        const { data: resp } = await api.post('/admin/auth/refresh-token', {
          refresh_token: refreshToken || undefined,
        });
        const payload = resp.data || resp;
        set({ accessToken: payload.access_token });
        return payload.access_token as string;
      },

      logout: () => {
        const token = get().accessToken;
        if (token) {
          api.post('/admin/auth/logout').catch(() => {});
        }
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'playzoon-admin-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

