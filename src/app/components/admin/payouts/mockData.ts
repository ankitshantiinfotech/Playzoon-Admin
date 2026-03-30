// ─── SCR-ADM-034 / SCR-ADM-035 Payout Management — Mock Data ─────────────────

import type { PayoutRequest, PayoutDetail, PayoutSummaryStat } from "./types";

// ─── Payout Requests (List View — SCR-ADM-034) ──────────────────────────────

export const MOCK_PAYOUT_REQUESTS: PayoutRequest[] = [
  // Pending
  {
    id: "PAY-2026-001",
    providerName: "Al Wasl Sports Complex",
    providerType: "Facility Provider",
    requestedAmount: 15355.00,
    walletBalance: 18500.00,
    status: "Pending",
    submissionDate: "2026-02-01T06:00:00Z",
    bankStatus: "Approved",
    providerId: "prov-01",
  },
  {
    id: "PAY-2026-002",
    providerName: "Ahmad Al-Rashidi",
    providerType: "Coach",
    requestedAmount: 6510.00,
    walletBalance: 8400.00,
    status: "Pending",
    submissionDate: "2026-02-01T08:30:00Z",
    bankStatus: "Approved",
    providerId: "prov-02",
  },
  {
    id: "PAY-2026-003",
    providerName: "Elite Football Academy",
    providerType: "Training Provider",
    requestedAmount: 10837.50,
    walletBalance: 12750.00,
    status: "Pending",
    submissionDate: "2026-02-01T07:15:00Z",
    bankStatus: "Approved",
    providerId: "prov-03",
  },
  {
    id: "PAY-2026-004",
    providerName: "Crescent Sports Club",
    providerType: "Facility Provider",
    requestedAmount: 6900.00,
    walletBalance: 9200.00,
    status: "Pending",
    submissionDate: "2026-02-01T09:00:00Z",
    bankStatus: "Not Approved",
    providerId: "prov-05",
  },
  {
    id: "PAY-2026-005",
    providerName: "London Premier Pitches",
    providerType: "Facility Provider",
    requestedAmount: 2733.50,
    walletBalance: 3850.00,
    status: "Pending",
    submissionDate: "2026-02-02T09:00:00Z",
    bankStatus: "Approved",
    providerId: "prov-06",
  },

  // Processing
  {
    id: "PAY-2026-006",
    providerName: "Cairo Sports Academy",
    providerType: "Training Provider",
    requestedAmount: 25920.00,
    walletBalance: 32000.00,
    status: "Processing",
    submissionDate: "2026-01-02T08:00:00Z",
    bankStatus: "Approved",
    providerId: "prov-11",
  },
  {
    id: "PAY-2026-007",
    providerName: "Kuwait Elite Training",
    providerType: "Training Provider",
    requestedAmount: 4416.00,
    walletBalance: 4800.00,
    status: "Processing",
    submissionDate: "2026-01-02T08:00:00Z",
    bankStatus: "Approved",
    providerId: "prov-12",
  },

  // Partially Paid
  {
    id: "PAY-2026-008",
    providerName: "Bahrain Water Sports Hub",
    providerType: "Facility Provider",
    requestedAmount: 4950.00,
    walletBalance: 5500.00,
    status: "Partially Paid",
    submissionDate: "2026-01-15T08:00:00Z",
    bankStatus: "Approved",
    providerId: "prov-10",
  },

  // Settled
  {
    id: "PAY-2026-009",
    providerName: "Al Wasl Sports Complex",
    providerType: "Facility Provider",
    requestedAmount: 13446.00,
    walletBalance: 16200.00,
    status: "Settled",
    submissionDate: "2026-01-02T06:00:00Z",
    bankStatus: "Approved",
    providerId: "prov-01",
  },
  {
    id: "PAY-2026-010",
    providerName: "Ahmad Al-Rashidi",
    providerType: "Coach",
    requestedAmount: 5890.00,
    walletBalance: 7600.00,
    status: "Settled",
    submissionDate: "2026-01-16T08:00:00Z",
    bankStatus: "Approved",
    providerId: "prov-02",
  },
  {
    id: "PAY-2026-011",
    providerName: "Elite Football Academy",
    providerType: "Training Provider",
    requestedAmount: 9690.00,
    walletBalance: 11400.00,
    status: "Settled",
    submissionDate: "2026-01-02T07:00:00Z",
    bankStatus: "Approved",
    providerId: "prov-03",
  },
  {
    id: "PAY-2026-012",
    providerName: "London Premier Pitches",
    providerType: "Facility Provider",
    requestedAmount: 2272.00,
    walletBalance: 3200.00,
    status: "Settled",
    submissionDate: "2026-01-26T09:00:00Z",
    bankStatus: "Approved",
    providerId: "prov-06",
  },
  {
    id: "PAY-2026-013",
    providerName: "Hassan Al-Farsi",
    providerType: "Coach",
    requestedAmount: 3633.00,
    walletBalance: 4200.00,
    status: "Settled",
    submissionDate: "2026-01-20T10:00:00Z",
    bankStatus: "Approved",
    providerId: "prov-09",
  },

  // Rejected
  {
    id: "PAY-2026-014",
    providerName: "Sharjah Fitness Zone",
    providerType: "Facility Provider",
    requestedAmount: 3403.00,
    walletBalance: 4100.00,
    status: "Rejected",
    submissionDate: "2026-01-02T08:00:00Z",
    bankStatus: "Not Approved",
    providerId: "prov-14",
  },
  {
    id: "PAY-2026-015",
    providerName: "Al-Riyadh Youth Sports Club",
    providerType: "Training Provider",
    requestedAmount: 4466.00,
    walletBalance: 5800.00,
    status: "Rejected",
    submissionDate: "2025-12-01T08:00:00Z",
    bankStatus: "Approved",
    providerId: "prov-15",
  },
];

// ─── Summary Stats ───────────────────────────────────────────────────────────

export function computePayoutStats(requests: PayoutRequest[]): PayoutSummaryStat[] {
  const statuses: PayoutRequest["status"][] = [
    "Pending",
    "Processing",
    "Partially Paid",
    "Settled",
    "Rejected",
  ];
  return statuses.map((status) => {
    const matching = requests.filter((r) => r.status === status);
    return {
      status,
      count: matching.length,
      totalAmount: matching.reduce((sum, r) => sum + r.requestedAmount, 0),
    };
  });
}

// ─── Payout Detail (SCR-ADM-035) — mock detail for PAY-2026-001 ─────────────

export const MOCK_PAYOUT_DETAILS: Record<string, PayoutDetail> = {
  "PAY-2026-001": {
    id: "PAY-2026-001",
    status: "Pending",
    requestedAmount: 15355.00,
    requestDate: "2026-02-01T06:00:00Z",
    adminNotes: "",
    provider: {
      id: "prov-01",
      name: "Al Wasl Sports Complex",
      type: "Facility Provider",
      email: "billing@alwasl-sports.ae",
      phone: "+971 4 555 1234",
      status: "Active",
    },
    bankAccount: {
      holderName: "Al Wasl Sports Complex LLC",
      bankName: "Emirates NBD",
      ibanMasked: "****4821",
      status: "Approved",
    },
    wallet: {
      availableBalance: 3145.00,
      lockedBalance: 15355.00,
      lifetimeEarnings: 128500.00,
    },
    cycle: {
      cycleDuration: "14 Days",
      currentCycleStart: "2026-01-25",
      currentCycleEnd: "2026-02-07",
      nextPayoutDate: "2026-02-08",
      amountPaidThisCycle: 0,
      amountRemainingThisCycle: 15355.00,
    },
    partialPayments: [],
    timeline: [
      {
        id: "tl-001",
        status: "Pending",
        timestamp: "2026-02-01T06:00:00Z",
        actor: "System",
        notes: "Payout request submitted automatically at cycle end.",
      },
    ],
    auditHistory: [
      {
        id: "ah-001",
        timestamp: "2026-02-01T06:00:00Z",
        admin: "System",
        action: "Payout request created",
        amount: 15355.00,
      },
    ],
  },
  "PAY-2026-002": {
    id: "PAY-2026-002",
    status: "Pending",
    requestedAmount: 6510.00,
    requestDate: "2026-02-01T08:30:00Z",
    provider: {
      id: "prov-02",
      name: "Ahmad Al-Rashidi",
      type: "Coach",
      email: "coach@rashidi.sa",
      phone: "+966 50 555 7743",
      status: "Active",
    },
    bankAccount: {
      holderName: "Ahmad Al-Rashidi",
      bankName: "Al Rajhi Bank",
      ibanMasked: "****7743",
      status: "Approved",
    },
    wallet: {
      availableBalance: 1890.00,
      lockedBalance: 6510.00,
      lifetimeEarnings: 72400.00,
    },
    cycle: {
      cycleDuration: "14 Days",
      currentCycleStart: "2026-01-25",
      currentCycleEnd: "2026-02-07",
      nextPayoutDate: "2026-02-08",
      amountPaidThisCycle: 0,
      amountRemainingThisCycle: 6510.00,
    },
    partialPayments: [],
    timeline: [
      {
        id: "tl-010",
        status: "Pending",
        timestamp: "2026-02-01T08:30:00Z",
        actor: "System",
        notes: "Payout request submitted.",
      },
    ],
    auditHistory: [
      {
        id: "ah-010",
        timestamp: "2026-02-01T08:30:00Z",
        admin: "System",
        action: "Payout request created",
        amount: 6510.00,
      },
    ],
  },
  "PAY-2026-004": {
    id: "PAY-2026-004",
    status: "Pending",
    requestedAmount: 6900.00,
    requestDate: "2026-02-01T09:00:00Z",
    adminNotes: "Bank account not yet verified — hold until bank verification completed.",
    provider: {
      id: "prov-05",
      name: "Crescent Sports Club",
      type: "Facility Provider",
      email: "accounts@crescentsc.sa",
      phone: "+966 11 444 5678",
      status: "Active",
    },
    bankAccount: {
      holderName: "Crescent Sports Club Co.",
      bankName: "Saudi National Bank",
      ibanMasked: "****3391",
      status: "Not Approved",
    },
    wallet: {
      availableBalance: 2300.00,
      lockedBalance: 6900.00,
      lifetimeEarnings: 45200.00,
    },
    cycle: {
      cycleDuration: "30 Days",
      currentCycleStart: "2026-01-01",
      currentCycleEnd: "2026-01-31",
      nextPayoutDate: "2026-02-10",
      amountPaidThisCycle: 0,
      amountRemainingThisCycle: 6900.00,
    },
    partialPayments: [],
    timeline: [
      {
        id: "tl-020",
        status: "Pending",
        timestamp: "2026-02-01T09:00:00Z",
        actor: "System",
        notes: "Payout request submitted.",
      },
    ],
    auditHistory: [
      {
        id: "ah-020",
        timestamp: "2026-02-01T09:00:00Z",
        admin: "System",
        action: "Payout request created",
        amount: 6900.00,
      },
    ],
  },
  "PAY-2026-006": {
    id: "PAY-2026-006",
    status: "Processing",
    requestedAmount: 25920.00,
    requestDate: "2026-01-02T08:00:00Z",
    provider: {
      id: "prov-11",
      name: "Cairo Sports Academy",
      type: "Training Provider",
      email: "accounts@cairosports.eg",
      phone: "+20 2 2555 1234",
      status: "Active",
    },
    bankAccount: {
      holderName: "Cairo Sports Academy Ltd.",
      bankName: "Commercial International Bank",
      ibanMasked: "****9910",
      status: "Approved",
    },
    wallet: {
      availableBalance: 6080.00,
      lockedBalance: 25920.00,
      lifetimeEarnings: 195000.00,
    },
    cycle: {
      cycleDuration: "30 Days",
      currentCycleStart: "2025-12-01",
      currentCycleEnd: "2025-12-31",
      nextPayoutDate: "2026-01-15",
      amountPaidThisCycle: 0,
      amountRemainingThisCycle: 25920.00,
    },
    partialPayments: [],
    timeline: [
      {
        id: "tl-030",
        status: "Processing",
        timestamp: "2026-01-07T09:00:00Z",
        actor: "Sarah Al-Mansoori",
        notes: "Approved and moved to processing. Bank transfer initiated.",
      },
      {
        id: "tl-031",
        status: "Pending",
        timestamp: "2026-01-02T08:00:00Z",
        actor: "System",
        notes: "Payout request submitted.",
      },
    ],
    auditHistory: [
      {
        id: "ah-030",
        timestamp: "2026-01-07T09:00:00Z",
        admin: "Sarah Al-Mansoori",
        action: "Payout approved",
        amount: 25920.00,
      },
      {
        id: "ah-031",
        timestamp: "2026-01-02T08:00:00Z",
        admin: "System",
        action: "Payout request created",
        amount: 25920.00,
      },
    ],
  },
  "PAY-2026-008": {
    id: "PAY-2026-008",
    status: "Partially Paid",
    requestedAmount: 4950.00,
    requestDate: "2026-01-15T08:00:00Z",
    provider: {
      id: "prov-10",
      name: "Bahrain Water Sports Hub",
      type: "Facility Provider",
      email: "finance@bwsh.bh",
      phone: "+973 1755 1234",
      status: "Active",
    },
    bankAccount: {
      holderName: "Bahrain Water Sports Hub W.L.L.",
      bankName: "Bank of Bahrain and Kuwait",
      ibanMasked: "****2271",
      status: "Approved",
    },
    wallet: {
      availableBalance: 550.00,
      lockedBalance: 2450.00,
      lifetimeEarnings: 62500.00,
    },
    cycle: {
      cycleDuration: "30 Days",
      currentCycleStart: "2026-01-01",
      currentCycleEnd: "2026-01-31",
      nextPayoutDate: "2026-02-08",
      amountPaidThisCycle: 2500.00,
      amountRemainingThisCycle: 2450.00,
    },
    partialPayments: [
      {
        id: "pp-001",
        date: "2026-01-25T14:00:00Z",
        amountPaid: 2500.00,
        remainingAfter: 2450.00,
        adminUser: "Sarah Al-Mansoori",
        notes: "First partial transfer completed via BBK.",
      },
    ],
    timeline: [
      {
        id: "tl-040",
        status: "Partially Paid",
        timestamp: "2026-01-25T14:00:00Z",
        actor: "Sarah Al-Mansoori",
        notes: "Partial payment of 2,500.00 SAR recorded.",
      },
      {
        id: "tl-041",
        status: "Processing",
        timestamp: "2026-01-20T10:00:00Z",
        actor: "Omar Hassan",
        notes: "Approved and moved to processing.",
      },
      {
        id: "tl-042",
        status: "Pending",
        timestamp: "2026-01-15T08:00:00Z",
        actor: "System",
        notes: "Payout request submitted.",
      },
    ],
    auditHistory: [
      {
        id: "ah-040",
        timestamp: "2026-01-25T14:00:00Z",
        admin: "Sarah Al-Mansoori",
        action: "Partial payment recorded",
        amount: 2500.00,
        notes: "First partial transfer completed via BBK.",
      },
      {
        id: "ah-041",
        timestamp: "2026-01-20T10:00:00Z",
        admin: "Omar Hassan",
        action: "Payout approved",
        amount: 4950.00,
      },
      {
        id: "ah-042",
        timestamp: "2026-01-15T08:00:00Z",
        admin: "System",
        action: "Payout request created",
        amount: 4950.00,
      },
    ],
  },
  "PAY-2026-009": {
    id: "PAY-2026-009",
    status: "Settled",
    requestedAmount: 13446.00,
    requestDate: "2026-01-02T06:00:00Z",
    provider: {
      id: "prov-01",
      name: "Al Wasl Sports Complex",
      type: "Facility Provider",
      email: "billing@alwasl-sports.ae",
      phone: "+971 4 555 1234",
      status: "Active",
    },
    bankAccount: {
      holderName: "Al Wasl Sports Complex LLC",
      bankName: "Emirates NBD",
      ibanMasked: "****4821",
      status: "Approved",
    },
    wallet: {
      availableBalance: 18500.00,
      lockedBalance: 0,
      lifetimeEarnings: 128500.00,
    },
    cycle: {
      cycleDuration: "14 Days",
      currentCycleStart: "2025-12-25",
      currentCycleEnd: "2026-01-07",
      nextPayoutDate: "2026-01-08",
      amountPaidThisCycle: 13446.00,
      amountRemainingThisCycle: 0,
    },
    partialPayments: [],
    timeline: [
      {
        id: "tl-050",
        status: "Settled",
        timestamp: "2026-01-09T14:22:00Z",
        actor: "Sarah Al-Mansoori",
        notes: "Bank transfer confirmed. Locked balance released.",
      },
      {
        id: "tl-051",
        status: "Processing",
        timestamp: "2026-01-07T10:00:00Z",
        actor: "Sarah Al-Mansoori",
        notes: "Approved and moved to processing.",
      },
      {
        id: "tl-052",
        status: "Pending",
        timestamp: "2026-01-02T06:00:00Z",
        actor: "System",
        notes: "Payout request submitted.",
      },
    ],
    auditHistory: [
      {
        id: "ah-050",
        timestamp: "2026-01-09T14:22:00Z",
        admin: "Sarah Al-Mansoori",
        action: "Payout settled",
        amount: 13446.00,
        notes: "Bank transfer confirmed.",
      },
      {
        id: "ah-051",
        timestamp: "2026-01-07T10:00:00Z",
        admin: "Sarah Al-Mansoori",
        action: "Payout approved",
        amount: 13446.00,
      },
      {
        id: "ah-052",
        timestamp: "2026-01-02T06:00:00Z",
        admin: "System",
        action: "Payout request created",
        amount: 13446.00,
      },
    ],
  },
  "PAY-2026-014": {
    id: "PAY-2026-014",
    status: "Rejected",
    requestedAmount: 3403.00,
    requestDate: "2026-01-02T08:00:00Z",
    rejectionReason: "Incomplete bank details — bank account details not verified. Please update your payment profile and resubmit.",
    provider: {
      id: "prov-14",
      name: "Sharjah Fitness Zone",
      type: "Facility Provider",
      email: "info@shfitness.ae",
      phone: "+971 6 555 4321",
      status: "Active",
    },
    bankAccount: {
      holderName: "Sharjah Fitness Zone LLC",
      bankName: "First Abu Dhabi Bank",
      ibanMasked: "****0000",
      status: "Not Approved",
    },
    wallet: {
      availableBalance: 4100.00,
      lockedBalance: 0,
      lifetimeEarnings: 22300.00,
    },
    cycle: {
      cycleDuration: "30 Days",
      currentCycleStart: "2025-12-01",
      currentCycleEnd: "2025-12-31",
      nextPayoutDate: "2026-01-08",
      amountPaidThisCycle: 0,
      amountRemainingThisCycle: 0,
    },
    partialPayments: [],
    timeline: [
      {
        id: "tl-060",
        status: "Rejected",
        timestamp: "2026-01-04T09:00:00Z",
        actor: "Omar Hassan",
        notes: "Rejected: Incomplete bank details.",
      },
      {
        id: "tl-061",
        status: "Pending",
        timestamp: "2026-01-02T08:00:00Z",
        actor: "System",
        notes: "Payout request submitted.",
      },
    ],
    auditHistory: [
      {
        id: "ah-060",
        timestamp: "2026-01-04T09:00:00Z",
        admin: "Omar Hassan",
        action: "Payout rejected",
        amount: 3403.00,
        notes: "Incomplete bank details.",
      },
      {
        id: "ah-061",
        timestamp: "2026-01-02T08:00:00Z",
        admin: "System",
        action: "Payout request created",
        amount: 3403.00,
      },
    ],
  },
};

// Helper to get a detail; falls back to generating a minimal one from list data
export function getPayoutDetail(id: string): PayoutDetail | null {
  if (MOCK_PAYOUT_DETAILS[id]) return MOCK_PAYOUT_DETAILS[id];

  const request = MOCK_PAYOUT_REQUESTS.find((r) => r.id === id);
  if (!request) return null;

  // Generate a minimal detail from the list request
  return {
    id: request.id,
    status: request.status,
    requestedAmount: request.requestedAmount,
    requestDate: request.submissionDate,
    provider: {
      id: request.providerId,
      name: request.providerName,
      type: request.providerType,
      email: `contact@${request.providerName.toLowerCase().replace(/\s+/g, "-")}.com`,
      phone: "+966 50 000 0000",
      status: "Active",
    },
    bankAccount: {
      holderName: request.providerName,
      bankName: "Bank",
      ibanMasked: "****0000",
      status: request.bankStatus,
    },
    wallet: {
      availableBalance: request.walletBalance - request.requestedAmount,
      lockedBalance: request.status === "Settled" || request.status === "Rejected" ? 0 : request.requestedAmount,
      lifetimeEarnings: request.walletBalance * 5,
    },
    cycle: {
      cycleDuration: "14 Days",
      currentCycleStart: "2026-01-25",
      currentCycleEnd: "2026-02-07",
      nextPayoutDate: "2026-02-08",
      amountPaidThisCycle: 0,
      amountRemainingThisCycle: request.requestedAmount,
    },
    partialPayments: [],
    timeline: [
      {
        id: `tl-gen-${request.id}`,
        status: request.status,
        timestamp: request.submissionDate,
        actor: "System",
        notes: "Payout request submitted.",
      },
    ],
    auditHistory: [
      {
        id: `ah-gen-${request.id}`,
        timestamp: request.submissionDate,
        admin: "System",
        action: "Payout request created",
        amount: request.requestedAmount,
      },
    ],
  };
}
