// ─── Banner Management Types ──────────────────────────────────

export interface Banner {
  id: string;
  imageUrl: string;
  bannerText: string;
  buttonLabel: string;
  redirectUrl: string;
  status: "Active" | "Inactive";
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type BannerFormData = Omit<Banner, "id" | "createdAt" | "updatedAt">;

export interface BannerAuditEntry {
  id: string;
  bannerId: string;
  bannerText: string;
  field: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
}

// ─── Mock Data ─────────────────────────────────────────────────

export const MOCK_BANNERS: Banner[] = [
  {
    id: "BNR-001",
    imageUrl:
      "https://images.unsplash.com/photo-1761644273884-83839f8f22e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    bannerText: "Summer Tournament Series 2026 — Register Now!",
    buttonLabel: "Register Now",
    redirectUrl: "/tournaments/summer-2026",
    status: "Active",
    sortOrder: 1,
    createdAt: "2026-01-15T09:00:00Z",
    updatedAt: "2026-02-20T14:30:00Z",
  },
  {
    id: "BNR-002",
    imageUrl:
      "https://images.unsplash.com/photo-1709587823868-735f9375ae74?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    bannerText: "50% Off Your First Padel Booking",
    buttonLabel: "Book Now",
    redirectUrl: "/facilities?sport=padel&promo=first50",
    status: "Active",
    sortOrder: 2,
    createdAt: "2026-01-20T11:00:00Z",
    updatedAt: "2026-02-18T10:15:00Z",
  },
  {
    id: "BNR-003",
    imageUrl:
      "https://images.unsplash.com/photo-1770237711452-037a780f2a87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    bannerText: "Weekend Football League — Join a Team Today",
    buttonLabel: "Join League",
    redirectUrl: "/leagues/weekend-football",
    status: "Active",
    sortOrder: 3,
    createdAt: "2026-02-01T08:30:00Z",
    updatedAt: "2026-02-22T16:45:00Z",
  },
  {
    id: "BNR-004",
    imageUrl:
      "https://images.unsplash.com/photo-1707365025743-23177fac01e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    bannerText: "Swim & Fitness Membership — AED 299/month",
    buttonLabel: "Learn More",
    redirectUrl: "/subscriptions/swim-fitness",
    status: "Inactive",
    sortOrder: 4,
    createdAt: "2026-02-05T13:00:00Z",
    updatedAt: "2026-02-15T09:20:00Z",
  },
  {
    id: "BNR-005",
    imageUrl:
      "https://images.unsplash.com/photo-1762025858816-bb383940763a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    bannerText: "Indoor Basketball Courts Now Available",
    buttonLabel: "Explore",
    redirectUrl: "/facilities?sport=basketball",
    status: "Inactive",
    sortOrder: 5,
    createdAt: "2026-02-10T10:00:00Z",
    updatedAt: "2026-02-10T10:00:00Z",
  },
];

export const MOCK_BANNER_AUDIT: BannerAuditEntry[] = [
  {
    id: "BAUD-001",
    bannerId: "BNR-001",
    bannerText: "Summer Tournament Series 2026",
    field: "Banner Text",
    oldValue: "Summer Tournament Series",
    newValue: "Summer Tournament Series 2026 — Register Now!",
    changedBy: "Super Admin",
    changedAt: "2026-02-20T14:30:00Z",
  },
  {
    id: "BAUD-002",
    bannerId: "BNR-002",
    bannerText: "50% Off Your First Padel Booking",
    field: "Button Label",
    oldValue: "Get Started",
    newValue: "Book Now",
    changedBy: "Super Admin",
    changedAt: "2026-02-18T10:15:00Z",
  },
  {
    id: "BAUD-003",
    bannerId: "BNR-004",
    bannerText: "Swim & Fitness Membership",
    field: "Status",
    oldValue: "Active",
    newValue: "Inactive",
    changedBy: "Admin User",
    changedAt: "2026-02-15T09:20:00Z",
  },
  {
    id: "BAUD-004",
    bannerId: "BNR-003",
    bannerText: "Weekend Football League",
    field: "Redirect URL",
    oldValue: "/leagues/football",
    newValue: "/leagues/weekend-football",
    changedBy: "Super Admin",
    changedAt: "2026-02-22T16:45:00Z",
  },
  {
    id: "BAUD-005",
    bannerId: "BNR-001",
    bannerText: "Summer Tournament Series 2026",
    field: "Sort Order",
    oldValue: "3",
    newValue: "1",
    changedBy: "Super Admin",
    changedAt: "2026-02-19T11:00:00Z",
  },
];
