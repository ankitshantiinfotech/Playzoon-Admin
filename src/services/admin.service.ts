import api from '@/lib/api';
import { Params } from 'react-router';

type P = Record<string, unknown>;

export const adminService = {
  // ── Auth (4) ──────────────────────────────────────────────────────────
  login: (email: string, password: string) =>
    api.post('/admin/auth/login', { email, password }).then(r => r.data),
  forgotPassword: (email: string) =>
    api.post('/admin/auth/forgot-password', { email }).then(r => r.data),
  resetPassword: (token: string, password: string) =>
    api.post('/admin/auth/reset-password', { token, password }).then(r => r.data),
  logout: () =>
    api.post('/admin/auth/logout').then(r => r.data),

  // ── Dashboard (1) ────────────────────────────────────────────────────
  getDashboard: () =>
    api.get('/admin/dashboard').then(r => r.data),

  // ── Players (7) ──────────────────────────────────────────────────────
  listPlayers: (params: P) =>
    api.get('/admin/players', { params }).then(r => r.data),
  getPlayer: (id: string) =>
    api.get(`/admin/players/${id}`).then(r => r.data),
  updatePlayer: (id: string, data: P) =>
    api.patch(`/admin/players/${id}`, data).then(r => r.data),
  bulkPlayerAction: (data: P) =>
    api.post('/admin/players/bulk-action', data).then(r => r.data),
  createPlayer: (data: P) =>
    api.post('/admin/players', data).then(r => r.data),
  deletePlayer: (id: string) =>
    api.delete(`/admin/players/${id}`).then(r => r.data),
  exportPlayers: (data: P) =>
    api.post('/admin/players/export', data).then(r => r.data),
  addPlayerAddress: (id: string, data: P) =>
    api.post(`/admin/players/${id}/addresses`, data).then(r => r.data),
  updatePlayerAddress: (id: string, addressId: string, data: P) =>
    api.put(`/admin/players/${id}/addresses/${addressId}`, data).then(r => r.data),
  deletePlayerAddress: (id: string, addressId: string) =>
    api.delete(`/admin/players/${id}/addresses/${addressId}`).then(r => r.data),
  addPlayerDependant: (id: string, data: P) =>
    api.post(`/admin/players/${id}/dependents`, data).then(r => r.data),
  updatePlayerDependant: (id: string, dependantId: string, data: P) =>
    api.put(`/admin/players/${id}/dependents/${dependantId}`, data).then(r => r.data),
  deletePlayerDependant: (id: string, dependantId: string) =>
    api.delete(`/admin/players/${id}/dependents/${dependantId}`).then(r => r.data),
  getPlayerPreferences: (id: string) =>
    api.get(`/admin/players/${id}/preferences`).then(r => r.data),
  updatePlayerPreferences: (id: string, data: P) =>
    api.patch(`/admin/players/${id}/preferences`, data).then(r => r.data),
  uploadPlayerPhoto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.post(`/admin/players/${id}/profile-photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  deletePlayerPhoto: (id: string) =>
    api.delete(`/admin/players/${id}/profile-photo`).then(r => r.data),
  addPlayerPaymentMethod: (id: string, data: P) =>
    api.post(`/admin/players/${id}/payment-methods`, data).then(r => r.data),
  removePlayerPaymentMethod: (id: string, paymentId: string) =>
    api.delete(`/admin/players/${id}/payment-methods/${paymentId}`).then(r => r.data),
  setPlayerDefaultPaymentMethod: (id: string, paymentId: string) =>
    api.put(`/admin/players/${id}/payment-methods/${paymentId}/default`, {}).then(r => r.data),

  // ── Providers (5) ────────────────────────────────────────────────────
  listProviders: (params: P) =>
    api.get('/admin/providers', { params }).then(r => r.data),
  getProvider: (id: string) =>
    api.get(`/admin/providers/${id}`).then(r => r.data),
  updateProvider: (id: string, data: P) =>
    api.patch(`/admin/providers/${id}`, data).then(r => r.data),
  approveProvider: (id: string, data: P) =>
    api.patch(`/admin/providers/${id}/onboarding`, data).then(r => r.data),
  bulkProviderAction: (data: P) =>
    api.post('/admin/providers/bulk-action', data).then(r => r.data),
  createProvider: (data: P) =>
    api.post('/admin/providers', data).then(r => r.data),

  /**
   * Same multipart contract as web PUT /profile/provider — applies to provider record directly.
   * Use draft=true for incomplete saves (relaxed validation).
   */
  putProviderProfile: (
    id: string,
    payload: P,
    profilePhotoLogo?: File | Blob | null,
    options?: {
      draft?: boolean;
      onUploadProgress?: (percent: number) => void;
      officialDocuments?: { file: File; documentType: string }[];
    },
  ) => {
    const draft = options?.draft === true;
    const url = `/admin/providers/${id}/profile${draft ? '?draft=true' : ''}`;
    const officialDocs = options?.officialDocuments && options.officialDocuments.length > 0;
    if (profilePhotoLogo || officialDocs) {
      const formData = new FormData();
      if (profilePhotoLogo) {
        formData.append('profile_photo_logo', profilePhotoLogo, 'provider-logo.jpg');
      }
      if (officialDocs) {
        const meta = options!.officialDocuments!.map((d) => ({
          document_type: d.documentType,
        }));
        formData.append('provider_documents', JSON.stringify(meta));
        for (const d of options!.officialDocuments!) {
          formData.append('official_documents', d.file, d.file.name);
        }
      }
      for (const [key, value] of Object.entries(payload)) {
        if (value === undefined || value === null) continue;
        if (key === 'provider_documents') continue;
        if (Array.isArray(value)) {
          if (key === 'remove_document_ids') {
            formData.append(key, JSON.stringify(value));
          } else {
            (value as unknown[]).forEach((v: unknown) =>
              formData.append(`${key}[]`, String(v)),
            );
          }
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
      return api
        .put(url, formData, {
          headers: { 'Content-Type': undefined as unknown as string },
          ...(options?.onUploadProgress
            ? {
                onUploadProgress: (e: { loaded: number; total?: number }) => {
                  if (!e.total || e.total <= 0) return;
                  const percent = Math.round((e.loaded * 100) / e.total);
                  options.onUploadProgress?.(Math.max(0, Math.min(100, percent)));
                },
              }
            : {}),
        })
        .then(r => r.data);
    }
    return api.put(url, payload).then(r => r.data);
  },

  // ── Country Modules (1) ──────────────────────────────────────────────
  getCountryModules: (params: P) =>
    api.get('/admin/country-modules', { params }).then(r => r.data),

  // ── Banners (2) ──────────────────────────────────────────────────────
  listBanners: (params: P) =>
    api.get('/admin/banners', { params }).then(r => r.data),
  manageBanner: (data: P) =>
    api.post('/admin/banners', data).then(r => r.data),

  // ── CMS (14) ─────────────────────────────────────────────────────────
  // Pages
  getPages: (params?: P) =>
    api.get('/admin/cms/pages', { params }).then(r => r.data),
  getPageById: (id: string) =>
    api.get(`/admin/cms/pages/${id}`).then(r => r.data),
  updatePage: (id: string, payload: P) =>
    api.patch(`/admin/cms/pages/${id}`, payload).then(r => r.data),

  // Aliases used by CMS UI layer
  listCmsPages: (params?: P) =>
    api.get('/admin/cms/pages', { params }).then(r => r.data),
  updateCmsPage: (id: string, payload: P) =>
    api.patch(`/admin/cms/pages/${id}`, payload).then(r => r.data),
  publishCmsPage: (id: string) =>
    api.post(`/admin/cms/pages/${id}/publish`).then(r => r.data),
  getCmsVersions: (id: string) =>
    api.get(`/admin/cms/pages/${id}/versions`).then(r => r.data),
  restoreCmsVersion: (id: string, versionId: string) =>
    api.post(`/admin/cms/pages/${id}/restore`, { versionId }).then(r => r.data),

  // FAQ
  createFAQ: (payload: P) =>
    api.post('/admin/cms/faq', payload).then(r => r.data),
  updateFAQ: (id: string, payload: P) =>
    api.patch(`/admin/cms/faq/${id}`, payload).then(r => r.data),
  deleteFAQ: (id: string) =>
    api.delete(`/admin/cms/faq/${id}`).then(r => r.data),

  // Contact Fields
  createContactField: (payload: P) =>
    api.post('/admin/cms/contact-fields', payload).then(r => r.data),
  updateContactField: (id: string, payload: P) =>
    api.patch(`/admin/cms/contact-fields/${id}`, payload).then(r => r.data),
  deleteContactField: (id: string) =>
    api.delete(`/admin/cms/contact-fields/${id}`).then(r => r.data),

  // Social Links
  getSocialLinks: () =>
    api.get('/admin/cms/social-links').then(r => r.data),
  updateSocialLinks: (payload: P) =>
    api.put('/admin/cms/social-links', payload).then(r => r.data),
  createSocialLink: (payload: P) =>
    api.post('/admin/cms/social-links', payload).then(r => r.data),
  updateSocialLink: (id: string, payload: P) =>
    api.patch(`/admin/cms/social-links/${id}`, payload).then(r => r.data),
  deleteSocialLink: (id: string) =>
    api.delete(`/admin/cms/social-links/${id}`).then(r => r.data),

  // ── Master Data (4) ──────────────────────────────────────────────────
  listSports: (params: P) =>
    api.get('/admin/master-data/sports', { params }).then(r => r.data),
  listCourtTypes: (params: P) =>
    api.get('/admin/master-data/court-types', { params }).then(r => r.data),
  listLocations: (params: P) =>
    api.get('/admin/master-data/locations', { params }).then(r => r.data),
  listMasterData: (type: string, params: P) =>
    api.get(`/admin/master-data/${type}`, { params }).then(r => r.data),
  getMasterDataItem: (type: string, itemId: string) =>
    api.get(`/admin/master-data/${type}/${itemId}`).then(r => r.data),
  createMasterDataItem: (type: string, body: P) =>
    api.post(`/admin/master-data/${type}`, body).then(r => r.data),
  patchMasterDataItem: (type: string, itemId: string, body: P) =>
    api.patch(`/admin/master-data/${type}/${itemId}`, body).then(r => r.data),
  deleteMasterDataItem: (type: string, itemId: string) =>
    api.delete(`/admin/master-data/${type}/${itemId}`).then(r => r.data),
  uploadSportIcon: (file: File) => {
    const formData = new FormData();
    formData.append('icon', file);
    return api.post('/admin/master-data/sports/upload-icon', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  /** Same payload as web GET /config/countries (public). */
  getPublicCountries: () =>
    api.get('/config/countries').then(r => r.data),

  // ── Reviews (3) ──────────────────────────────────────────────────────
  listReviews: (params: P) =>
    api.get('/admin/reviews', { params }).then(r => r.data),
  getReview: (id: string) =>
    api.get(`/admin/reviews/${id}`).then(r => r.data),
  updateReview: (id: string, data: P) =>
    api.patch(`/admin/reviews/${id}`, data).then(r => r.data),

  // ── Enquiries (4) ────────────────────────────────────────────────────
  listEnquiries: (params: P) =>
    api.get('/admin/enquiries', { params }).then(r => r.data),
  getEnquiry: (id: string) =>
    api.get(`/admin/enquiries/${id}`).then(r => r.data),
  replyEnquiry: (id: string, data: P) =>
    api.post(`/admin/enquiries/${id}/reply`, data).then(r => r.data),
  updateEnquiryStatus: (id: string, data: P) =>
    api.patch(`/admin/enquiries/${id}/status`, data).then(r => r.data),

  // ── Bank Accounts (2) ────────────────────────────────────────────────
  listBankAccounts: (params: P) =>
    api.get('/admin/bank-accounts', { params }).then(r => r.data),
  approveBankAccount: (id: string, data: P) =>
    api.patch(`/admin/bank-accounts/${id}`, data).then(r => r.data),

  // ── Facility Requests (2) ────────────────────────────────────────────
  listFacilityRequests: (params: P) =>
    api.get('/admin/facility-requests', { params }).then(r => r.data),
  approveFacilityRequest: (id: string, data: P) =>
    api.patch(`/admin/facility-requests/${id}`, data).then(r => r.data),

  // ── Settings (4) ─────────────────────────────────────────────────────
  getSettings: () =>
    api.get('/admin/settings').then(r => r.data),
  updateSettings: (data: P) =>
    api.patch('/admin/settings', data).then(r => r.data),
  getCommissions: (params: P) =>
    api.get('/admin/settings/commission', { params }).then(r => r.data),
  updateCommission: (id: string, data: P) =>
    api.put(`/admin/settings/commission/${id}`, data).then(r => r.data),

  // ── Sub-Admins (2) ───────────────────────────────────────────────────
  listSubAdmins: (params: P) =>
    api.get('/admin/sub-admins', { params }).then(r => r.data),
  manageSubAdmin: (data: P) =>
    api.post('/admin/sub-admins', data).then(r => r.data),

  // ── Bookings (3) ─────────────────────────────────────────────────────
  listBookings: (params: P) =>
    api.get('/admin/bookings', { params }).then(r => r.data),
  getBooking: (id: string) =>
    api.get(`/admin/bookings/${id}`).then(r => r.data),
  cancelBooking: (id: string, data: P) =>
    api.post(`/admin/bookings/${id}/cancel`, data).then(r => r.data),

  // ── Tournaments (2) ──────────────────────────────────────────────────
  listTournaments: (params: P) =>
    api.get('/admin/tournaments', { params }).then(r => r.data),
  updateTournament: (id: string, data: P) =>
    api.patch(`/admin/tournaments/${id}`, data).then(r => r.data),

  // ── Trainings (1) ────────────────────────────────────────────────────
  listTrainings: (params: P) =>
    api.get('/admin/trainings', { params }).then(r => r.data),

  // ── Facilities (1) ───────────────────────────────────────────────────
  listFacilities: (params: P) =>
    api.get('/admin/facilities', { params }).then(r => r.data),

  // ── Promotions (1) ───────────────────────────────────────────────────
  listPromotions: (params: P) =>
    api.get('/admin/promotions', { params }).then(r => r.data),

  // ── Payouts (5) ──────────────────────────────────────────────────────
  listPayouts: (params: P) =>
    api.get('/admin/payouts', { params }).then(r => r.data),
  getPayoutDetail: (id: string) =>
    api.get(`/admin/payouts/${id}`).then(r => r.data),
  approvePayout: (id: string) =>
    api.patch(`/admin/payouts/${id}/approve`).then(r => r.data),
  rejectPayout: (id: string, data: P) =>
    api.patch(`/admin/payouts/${id}/reject`, data).then(r => r.data),
  processPayout: (id: string) =>
    api.post(`/admin/payouts/${id}/process`).then(r => r.data),

  // ── Push Notifications (3) ───────────────────────────────────────────
  createPushNotif: (data: P) =>
    api.post('/admin/push-notifications', data).then(r => r.data),
  listPushNotifs: (params: P) =>
    api.get('/admin/push-notifications', { params }).then(r => r.data),
  getPushNotif: (id: string) =>
    api.get(`/admin/push-notifications/${id}`).then(r => r.data),

  // ── Wallets (2) ──────────────────────────────────────────────────────
  getUserWallet: (userId: string) =>
    api.get(`/admin/wallets/${userId}`).then(r => r.data),
  getUserTransactions: (userId: string, params: P) =>
    api.get(`/admin/wallets/${userId}/transactions`, { params }).then(r => r.data),

  // ── Notification Settings (3) ────────────────────────────────────────
  getNotifSettings: () =>
    api.get('/admin/notification-settings').then(r => r.data),
  updateNotifSetting: (eventTypeId: string, data: P) =>
    api.patch(`/admin/notification-settings/${eventTypeId}`, data).then(r => r.data),
  toggleNotifSetting: (eventTypeId: string) =>
    api.patch(`/admin/notification-settings/${eventTypeId}/toggle`).then(r => r.data),

  // ── Reports (2) ──────────────────────────────────────────────────────
  getReport: (type: string, params: P) =>
    api.get(`/admin/reports/${type}`, { params }).then(r => r.data),
  exportReport: (data: P) =>
    api.post('/admin/reports/export', data).then(r => r.data),

  // ── Payments (4) ─────────────────────────────────────────────────────
  listPayments: (params: P) =>
    api.get('/admin/payments', { params }).then(r => r.data),
  getPayment: (id: string) =>
    api.get(`/admin/payments/${id}`).then(r => r.data),
  getReconciliation: (params: P) =>
    api.get('/admin/payments/reconciliation', { params }).then(r => r.data),
  ackMismatch: (id: string, data: P) =>
    api.patch(`/admin/payments/reconciliation/${id}`, data).then(r => r.data),

  // ── Audit (1) ────────────────────────────────────────────────────────
  getAuditTrail: (params: P) =>
    api.get('/admin/audit-trail', { params }).then(r => r.data),
};
