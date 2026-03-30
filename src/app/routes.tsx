import React from "react";
import { createBrowserRouter } from "react-router";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";
import { AdminLogin } from "./components/AdminLogin";
import { ForgotPasswordPage } from "./components/ForgotPassword";
import { ResetPasswordPage } from "./components/ResetPassword";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminDashboardPage } from "./components/admin/dashboard/AdminDashboardPage";
import { PlayerManagementPage } from "./components/admin/players/PlayerManagementPage";
import { PlayerDetailPage } from "./components/admin/players/PlayerDetailPage";
import { CreatePlayerPage } from "./components/admin/players/CreatePlayerPage";
import { ServiceProvidersPage } from "./components/admin/providers/ServiceProvidersPage";
import { AdminFacilityPage } from "./components/admin/facilities/AdminFacilityPage";
import { AdminTrainingPage } from "./components/admin/trainings/AdminTrainingPage";
import { AdminBookingPage } from "./components/admin/bookings/AdminBookingPage";
import { BookingDetailPage } from "./components/admin/bookings/BookingDetailPage";
import { AdminTournamentPage } from "./components/admin/tournaments/AdminTournamentPage";
import { TournamentDetailPage } from "./components/admin/tournaments/TournamentDetailPage";
import { AdminWalletPage } from "./components/admin/wallets/AdminWalletPage";
import { AdminPaymentPage } from "./components/admin/payments/AdminPaymentPage";
import { AdminReviewPage } from "./components/admin/reviews/AdminReviewPage";
import { AdminNotificationPage } from "./components/admin/notifications/AdminNotificationPage";
import { AdminChatPage } from "./components/admin/chat/AdminChatPage";
import { AdminPromotionsPage } from "./components/admin/promotions/AdminPromotionsPage";
import { PricingConfigurationTab } from "./components/admin/promotions/PricingConfigurationTab";
import { AdminReportsPage } from "./components/admin/reports/AdminReportsPage";
import { MasterDataPage } from "./components/admin/master-data/MasterDataPage";
import { CategoryFormPage } from "./components/admin/master-data/CategoryFormPage";
import { PlatformSettingsPage } from "./components/admin/settings/PlatformSettingsPage";
import { AdminTeamPage } from "./components/admin/team/AdminTeamPage";
import { EntityManagementPage } from "./components/admin/entities/EntityManagementPage";
import { CMSManagementPage } from "./components/admin/cms/CMSManagementPage";
import { RefreshLogPage } from "./components/admin/refresh-log/RefreshLogPage";
import { EnquiriesPage } from "./components/admin/enquiries/EnquiriesPage";
import { AuditTrailPage } from "./components/admin/audit-trail/AuditTrailPage";
import { PlaceholderPage } from "./components/admin/PlaceholderPage";
import { ProviderPortalPage } from "./components/admin/providers/portal/ProviderPortalPage";
import { CommunicationSettingsPage } from "./components/admin/communication/CommunicationSettingsPage";
import { TrainingProviderDetailPage } from "./components/admin/providers/detail/TrainingProviderDetailPage";
import { TrainingProviderFormPage } from "./components/admin/providers/form/TrainingProviderFormPage";
import { FacilityProviderFormPage } from "./components/admin/providers/form/FacilityProviderFormPage";
import { FreelancerCoachFormPage } from "./components/admin/providers/form/FreelancerCoachFormPage";
import { CommissionsPage } from "./components/admin/commissions/CommissionsPage";
import { CommissionFormPage } from "./components/admin/commissions/CommissionFormPage";
import { CountryManagementPage } from "./components/admin/countries/CountryManagementPage";
import { CountryConfigurationPage } from "./components/admin/countries/CountryConfigurationPage";
import { BannerManagementPage } from "./components/admin/banners/BannerManagementPage";
import { PayoutsPage } from "./components/admin/payouts/PayoutsPage";
import { PayoutDetailPage } from "./components/admin/payouts/PayoutDetailPage";
import { SubAdminsPage } from "./components/admin/sub-admins/SubAdminsPage";
import { RoleConfigPage } from "./components/admin/sub-admins/RoleConfigPage";
import { CancellationPoliciesPage } from "./components/admin/cancellation-policies/CancellationPoliciesPage";
import { AdminListingsPage } from "./components/admin/listings/AdminListingsPage";
import { AdminBankVerificationPage } from "./components/admin/bank-verification/AdminBankVerificationPage";
import { AdminSettingsPage } from "./components/admin/admin-settings/AdminSettingsPage";
import { TrackActivitiesPage } from "./components/admin/track-activities/TrackActivitiesPage";
import { NotificationCentrePage } from "./components/admin/notification-centre/NotificationCentrePage";
import { ReviewDetailPage } from "./components/admin/reviews/ReviewDetailPage";
import { EnquiryDetailPage } from "./components/admin/enquiries/EnquiryDetailPage";
import { FreelanceCoachListPage } from "./components/admin/coaches/FreelanceCoachListPage";
import { FreelanceCoachDetailPage } from "./components/admin/coaches/FreelanceCoachDetailPage";
import { BankVerificationDetailPage } from "./components/admin/bank-verification/BankVerificationDetailPage";
import { FinancialDashboardPage } from "./components/admin/financial-dashboard/FinancialDashboardPage";
import { ReconciliationPage } from "./components/admin/reconciliation/ReconciliationPage";
import { EmailTemplatesPage } from "./components/admin/email-templates/EmailTemplatesPage";
import { NotificationSettingsPage } from "./components/admin/notification-settings/NotificationSettingsPage";
import { LocationMasterPage } from "./components/admin/locations/LocationMasterPage";
import { CountryModuleManagementPage } from "./components/admin/country-modules/CountryModuleManagementPage";
import { StartOfWeekPage } from "./components/admin/start-of-week/StartOfWeekPage";
import { RelationMasterPage } from "./components/admin/relations/RelationMasterPage";
import { SpecialityMasterPage } from "./components/admin/specialities/SpecialityMasterPage";
import { AmenityMasterPage } from "./components/admin/amenities/AmenityMasterPage";
import { EnquiryCategoryMasterPage } from "./components/admin/enquiry-categories/EnquiryCategoryMasterPage";

function NotFoundPage() {
  return <PlaceholderPage title="404 — Page Not Found" description="The page you're looking for doesn't exist." />;
}

export const router = createBrowserRouter([
  // Auth routes (no AdminLayout sidebar)
  { path: "/login", Component: AdminLogin },
  { path: "/forgot-password", Component: ForgotPasswordPage },
  { path: "/reset-password", Component: ResetPasswordPage },
  {
    path: "/",
    Component: AdminLayout,
    children: [
      {
        // Auth guard — all admin routes require login
        element: <AdminProtectedRoute />,
        children: [
      { index: true, Component: AdminDashboardPage },
      { path: "players", Component: PlayerManagementPage },
      { path: "players/new", Component: CreatePlayerPage },
      { path: "players/:id", Component: PlayerDetailPage },
      { path: "providers", Component: ServiceProvidersPage },
      { path: "providers/new", Component: TrainingProviderFormPage },
      { path: "providers/:id", Component: TrainingProviderDetailPage },
      { path: "providers/:id/edit", Component: TrainingProviderFormPage },
      { path: "providers/facility/new", Component: FacilityProviderFormPage },
      { path: "providers/facility/:id", Component: FacilityProviderFormPage },  // placeholder detail route
      { path: "providers/facility/:id/edit", Component: FacilityProviderFormPage },
      { path: "providers/coach/new", Component: FreelancerCoachFormPage },
      { path: "providers/coach/:id/edit", Component: FreelancerCoachFormPage },
      { path: "provider-portal/:id", Component: ProviderPortalPage },
      { path: "coaches", Component: FreelanceCoachListPage },
      { path: "coaches/new", Component: FreelancerCoachFormPage },
      { path: "coaches/:id", Component: FreelanceCoachDetailPage },
      { path: "coaches/:id/edit", Component: FreelancerCoachFormPage },
      { path: "facilities", Component: AdminFacilityPage },
      { path: "trainings", Component: AdminTrainingPage },
      { path: "bookings", Component: AdminBookingPage },
      { path: "bookings/:id", Component: BookingDetailPage },
      { path: "tournaments", Component: AdminTournamentPage },
      { path: "tournaments/:id", Component: TournamentDetailPage },
      { path: "listings", Component: AdminListingsPage },
      { path: "wallets", Component: AdminWalletPage },
      { path: "payouts", Component: PayoutsPage },
      { path: "payouts/:id", Component: PayoutDetailPage },
      { path: "bank-verification", Component: AdminBankVerificationPage },
      { path: "bank-verification/:id", Component: BankVerificationDetailPage },
      { path: "reviews", Component: AdminReviewPage },
      { path: "reviews/:id", Component: ReviewDetailPage },
      { path: "promotions", Component: AdminPromotionsPage },
      { path: "promotions/pricing", Component: PricingConfigurationTab },
      { path: "refresh-log", Component: RefreshLogPage },
      { path: "chat", Component: AdminChatPage },
      { path: "communication", Component: CommunicationSettingsPage },
      { path: "notifications", Component: AdminNotificationPage },
      { path: "cms", Component: CMSManagementPage },
      { path: "master-data", Component: MasterDataPage },
      { path: "master-data/:category/new", Component: CategoryFormPage },
      { path: "master-data/:category/:id/edit", Component: CategoryFormPage },
      { path: "settings", Component: PlatformSettingsPage },
      { path: "sub-admins", Component: SubAdminsPage },
      { path: "sub-admins/roles/new", Component: RoleConfigPage },
      { path: "sub-admins/roles/:id/edit", Component: RoleConfigPage },
      { path: "reports", Component: AdminReportsPage },
      { path: "payments", Component: AdminPaymentPage },
      { path: "enquiries", Component: EnquiriesPage },
      { path: "enquiries/:id", Component: EnquiryDetailPage },
      { path: "audit-trail", Component: AuditTrailPage },
      { path: "financial-dashboard", Component: FinancialDashboardPage },
      { path: "reconciliation", Component: ReconciliationPage },
      { path: "entities", Component: EntityManagementPage },
      { path: "team", Component: AdminTeamPage },
      { path: "commissions", Component: CommissionsPage },
      { path: "commissions/new", Component: CommissionFormPage },
      { path: "commissions/:id/edit", Component: CommissionFormPage },
      { path: "countries", Component: CountryManagementPage },
      { path: "countries/:id", Component: CountryConfigurationPage },
      { path: "banners", Component: BannerManagementPage },
      { path: "cancellation-policies", Component: CancellationPoliciesPage },
      { path: "admin-settings", Component: AdminSettingsPage },
      { path: "track-activities", Component: TrackActivitiesPage },
      { path: "notification-centre", Component: NotificationCentrePage },
      { path: "email-templates", Component: EmailTemplatesPage },
      { path: "notification-settings", Component: NotificationSettingsPage },
      { path: "locations", Component: LocationMasterPage },
      { path: "country-modules", Component: CountryModuleManagementPage },
      { path: "relations", Component: RelationMasterPage },
      { path: "specialities", Component: SpecialityMasterPage },
      { path: "amenities", Component: AmenityMasterPage },
      { path: "enquiry-categories", Component: EnquiryCategoryMasterPage },
      { path: "start-of-week", Component: StartOfWeekPage },
        ],
      },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);