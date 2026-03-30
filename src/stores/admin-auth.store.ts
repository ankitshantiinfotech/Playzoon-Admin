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

      refreshAccessToken: async () => {
        try {
          const { data: resp } = await api.post('/admin/auth/refresh-token');
          const payload = resp.data || resp;
          set({ accessToken: payload.access_token });
          return payload.access_token;
        } catch {
          get().logout();
          return null;
        }
      },

      logout: () => {
        const token = get().accessToken;
        if (token) {
          api.post('/admin/auth/logout').catch(() => {});
        }
        set({ accessToken: null, user: null, isAuthenticated: false });
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'playzoon-admin-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
