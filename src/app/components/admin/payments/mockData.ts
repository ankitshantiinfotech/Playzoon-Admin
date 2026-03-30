// ─── US-102 Payment Management — Mock Data ───────────────────────────────────
import { subDays, subHours, subMinutes, format } from "date-fns";
import {
  PaymentTransaction, TxnPlayer, TxnProvider,
  PaymentStatus, PaymentMethod, CardBrand, TransactionType,
  RefundRecord, AdminNote,
} from "./types";

// ─── Deterministic helpers ────────────────────────────────────────────────────
const s = (n: number) => { const x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };
const pick = <T,>(arr: T[], n: number): T => arr[Math.floor(s(n) * arr.length)];
const rng  = (n: number, min: number, max: number) => Math.floor(min + s(n) * (max - min));

// ─── Reference data ───────────────────────────────────────────────────────────

const PLAYERS: TxnPlayer[] = [
  { id: "PLY-001", name: "Layla Al-Mansouri",  email: "layla@example.com",   phone: "+971 50 123 4567", avatar: "https://i.pravatar.cc/150?u=layla" },
  { id: "PLY-002", name: "Khalid Ibrahim",      email: "khalid@example.com",  phone: "+971 55 234 5678", avatar: "https://i.pravatar.cc/150?u=khalid" },
  { id: "PLY-003", name: "Sara Ahmed",          email: "sara@example.com",    phone: "+966 50 345 6789", avatar: "https://i.pravatar.cc/150?u=sara" },
  { id: "PLY-004", name: "Omar Hassan",         email: "omar@example.com",    phone: "+971 52 456 7890", avatar: "https://i.pravatar.cc/150?u=omar" },
  { id: "PLY-005", name: "Fatima Al-Zahra",     email: "fatima@example.com",  phone: "+971 54 567 8901", avatar: "https://i.pravatar.cc/150?u=fatima" },
  { id: "PLY-006", name: "Nour Abdullah",       email: "nour@example.com",    phone: "+966 55 678 9012", avatar: "https://i.pravatar.cc/150?u=nour" },
  { id: "PLY-007", name: "Ahmad Tariq",         email: "ahmad@example.com",   phone: "+971 50 789 0123", avatar: "https://i.pravatar.cc/150?u=ahmad" },
  { id: "PLY-008", name: "Rania Khalil",        email: "rania@example.com",   phone: "+971 56 890 1234", avatar: "https://i.pravatar.cc/150?u=rania" },
  { id: "PLY-009", name: "Yusuf Al-Rashid",     email: "yusuf@example.com",   phone: "+971 55 901 2345", avatar: "https://i.pravatar.cc/150?u=yusuf" },
  { id: "PLY-010", name: "Amira Nasser",        email: "amira@example.com",   phone: "+966 54 012 3456", avatar: "https://i.pravatar.cc/150?u=amira" },
  { id: "PLY-011", name: "Tariq Al-Balushi",    email: "tariq@example.com",   phone: "+971 52 123 4568", avatar: "https://i.pravatar.cc/150?u=tariq" },
  { id: "PLY-012", name: "Hana Karim",          email: "hana@example.com",    phone: "+971 50 234 5679", avatar: "https://i.pravatar.cc/150?u=hana" },
];

const PROVIDERS: TxnProvider[] = [
  { id: "PRV-001", name: "Al Ahly Sports Club",    type: "Facility"  },
  { id: "PRV-002", name: "Smash Academy Dubai",    type: "Training"  },
  { id: "PRV-003", name: "UAE Sports Complex",     type: "Facility"  },
  { id: "PRV-004", name: "Pro Fitness Center",     type: "Training"  },
  { id: "PRV-005", name: "Desert Sports Park",     type: "Facility"  },
  { id: "PRV-006", name: "Coach Khalid Al-Farsi",  type: "Coach"     },
  { id: "PRV-007", name: "Elite Sports Academy",   type: "Training"  },
  { id: "PRV-008", name: "Coach Sara Mansouri",    type: "Coach"     },
];

// ─── Factory helpers ──────────────────────────────────────────────────────────

function makeGatewayRef(i: number): string {
  return `MF-${700000 + rng(i + 900, 1000, 99999)}`;
}

function makeMethod(i: number): { method: PaymentMethod; cardBrand: CardBrand; cardLast4?: string } {
  const m = rng(i, 0, 6);
  if (m === 0) return { method: "Card", cardBrand: "Visa",       cardLast4: `${4000 + rng(i * 3, 0, 999)}` };
  if (m === 1) return { method: "Card", cardBrand: "MasterCard", cardLast4: `${5000 + rng(i * 5, 0, 999)}` };
  if (m === 2) return { method: "Wallet",    cardBrand: null };
  if (m === 3) return { method: "Apple Pay", cardBrand: null };
  if (m === 4) return { method: "Google Pay",cardBrand: null };
  if (m === 5) return { method: "Mada",      cardBrand: "Mada",  cardLast4: `${6000 + rng(i * 7, 0, 999)}` };
  return       { method: "STC Pay",          cardBrand: null };
}

function makeGatewayCode(status: PaymentStatus): string {
  if (status === "Failed") {
    return pick(["005 - Insufficient Funds", "014 - Invalid Card", "091 - Issuer Unavailable", "003 - 3DS Authentication Failed"], 77);
  }
  if (status === "Pending") return "001 - Transaction Pending";
  return "000 - Approved";
}

function makeRefundHistory(i: number, originalAmount: number, refundedTotal: number): RefundRecord[] {
  if (refundedTotal === 0) return [];
  const isPartial = refundedTotal < originalAmount;
  return [{
    id: `REF-${10000 + i}`,
    amount: refundedTotal,
    destination: rng(i + 200, 0, 2) === 0 ? "Original Payment Method" : "Player Wallet",
    reason: pick(["Customer requested cancellation", "Facility unavailable at booked time", "Duplicate booking detected", "Provider no-show confirmed"], i),
    processedBy: "Admin Mohammed Al-Sayed",
    processedAt: subHours(subDays(new Date(), rng(i, 0, 5)), rng(i + 1, 1, 20)).toISOString(),
    status: "Completed",
  }];
}

function makeAdminNotes(i: number): AdminNote[] {
  if (rng(i + 500, 0, 3) !== 0) return [];
  return [{
    id: `NOTE-${i}`,
    note: pick([
      "Player contacted support about this transaction. Investigated and confirmed legitimate.",
      "Flagged for potential duplicate — verified unique transaction with gateway.",
      "Provider confirmed booking at disputed time slot. No refund warranted.",
      "Refund approved per cancellation policy (< 24h window).",
    ], i + 600),
    addedBy: "Admin Mohammed Al-Sayed",
    addedAt: subHours(subDays(new Date(), rng(i, 0, 3)), rng(i, 1, 12)).toISOString(),
  }];
}

// ─── Transaction generator ────────────────────────────────────────────────────

export function generateMockPayments(): PaymentTransaction[] {
  const now = new Date();
  const txns: PaymentTransaction[] = [];

  // ── Booking Payments ──────────────────────────────────────────────────────
  const bookingConfigs: { status: PaymentStatus; count: number }[] = [
    { status: "Success",          count: 20 },
    { status: "Refunded",         count: 5  },
    { status: "Refund Initiated", count: 3  },
    { status: "Failed",           count: 4  },
    { status: "Resolved",         count: 3  },
    { status: "Pending",          count: 2  },
  ];

  let idx = 1;
  for (const { status, count } of bookingConfigs) {
    for (let k = 0; k < count; k++) {
      const i = idx++;
      const amount = rng(i * 7, 80, 950);
      const isRefunded = status === "Refunded";
      const isRefundInit = status === "Refund Initiated";
      const refundedTotal = isRefunded ? amount : isRefundInit ? Math.floor(amount * 0.6) : 0;
      const { method, cardBrand, cardLast4 } = makeMethod(i);
      const createdAt = subHours(subDays(now, rng(i * 3, 0, 30)), rng(i * 5, 0, 23)).toISOString();

      txns.push({
        id: `TXN-${10000 + i}`,
        gatewayReference: makeGatewayRef(i),
        player: pick(PLAYERS, i),
        provider: pick(PROVIDERS, i + 30),
        type: "Booking Payment",
        amount,
        currency: "AED",
        method,
        cardBrand,
        cardLast4,
        status,
        gatewayResponseCode: makeGatewayCode(status),
        createdAt,
        processedAt: status !== "Pending" ? subMinutes(new Date(createdAt), -2).toISOString() : undefined,
        completedAt: ["Success", "Refunded", "Refund Initiated", "Resolved"].includes(status)
          ? subMinutes(new Date(createdAt), -4).toISOString() : undefined,
        receiptUrl: ["Success", "Refunded", "Refund Initiated"].includes(status) ? "#" : undefined,
        bookingId: `BK-${4000 + rng(i * 11, 100, 999)}`,
        refundHistory: makeRefundHistory(i, amount, refundedTotal),
        totalRefunded: refundedTotal,
        adminNotes: makeAdminNotes(i),
        resolution: status === "Resolved" ? {
          reason: pick([
            "Player confirmed receipt via bank statement. No further action required.",
            "Provider confirmed the booking was honoured. Player dispute closed.",
            "Issue resolved via offline bank transfer. Transaction manually reconciled.",
          ], i + 800),
          resolvedBy: "Admin Mohammed Al-Sayed",
          resolvedAt: subHours(new Date(createdAt), -rng(i, 2, 24)).toISOString(),
        } : undefined,
      });
    }
  }

  // ── Wallet Top-Ups ────────────────────────────────────────────────────────
  const topUpConfigs: { status: PaymentStatus; count: number }[] = [
    { status: "Success", count: 10 },
    { status: "Failed",  count: 3  },
    { status: "Pending", count: 1  },
  ];

  for (const { status, count } of topUpConfigs) {
    for (let k = 0; k < count; k++) {
      const i = idx++;
      const amount = pick([50, 100, 150, 200, 300, 500], i);
      const { method, cardBrand, cardLast4 } = makeMethod(i + 100);
      const createdAt = subHours(subDays(now, rng(i * 3, 0, 28)), rng(i, 0, 22)).toISOString();

      txns.push({
        id: `TXN-${10000 + i}`,
        gatewayReference: makeGatewayRef(i + 300),
        player: pick(PLAYERS, i + 50),
        type: "Wallet Top-Up",
        amount,
        currency: "AED",
        method,
        cardBrand,
        cardLast4,
        status,
        gatewayResponseCode: makeGatewayCode(status),
        createdAt,
        processedAt: status !== "Pending" ? subMinutes(new Date(createdAt), -1).toISOString() : undefined,
        completedAt: status === "Success" ? subMinutes(new Date(createdAt), -2).toISOString() : undefined,
        receiptUrl: status === "Success" ? "#" : undefined,
        refundHistory: [],
        totalRefunded: 0,
        adminNotes: [],
      });
    }
  }

  // ── Payouts ───────────────────────────────────────────────────────────────
  const payoutConfigs: { status: PaymentStatus; count: number }[] = [
    { status: "Success", count: 7 },
    { status: "Pending", count: 2 },
    { status: "Failed",  count: 1 },
  ];

  for (const { status, count } of payoutConfigs) {
    for (let k = 0; k < count; k++) {
      const i = idx++;
      const amount = rng(i * 13, 800, 8500);
      const createdAt = subHours(subDays(now, rng(i * 2, 0, 14)), rng(i, 0, 18)).toISOString();

      txns.push({
        id: `TXN-${10000 + i}`,
        gatewayReference: makeGatewayRef(i + 600),
        player: pick(PLAYERS, i + 80),  // payout recipient (used as player field for display)
        provider: pick(PROVIDERS, i + 20),
        type: "Payout",
        amount,
        currency: "AED",
        method: "Card",
        cardBrand: pick(["Visa", "MasterCard"], i) as CardBrand,
        cardLast4: `${8000 + rng(i * 9, 0, 999)}`,
        status,
        gatewayResponseCode: makeGatewayCode(status),
        createdAt,
        processedAt: status !== "Pending" ? subMinutes(new Date(createdAt), -5).toISOString() : undefined,
        completedAt: status === "Success" ? subMinutes(new Date(createdAt), -10).toISOString() : undefined,
        refundHistory: [],
        totalRefunded: 0,
        adminNotes: makeAdminNotes(i + 900),
      });
    }
  }

  // ── Refund transactions (standalone refund-type entries) ──────────────────
  for (let k = 0; k < 6; k++) {
    const i = idx++;
    const amount = rng(i * 17, 40, 420);
    const createdAt = subHours(subDays(now, rng(i * 4, 0, 20)), rng(i, 0, 20)).toISOString();

    txns.push({
      id: `TXN-${10000 + i}`,
      gatewayReference: makeGatewayRef(i + 800),
      player: pick(PLAYERS, i + 70),
      type: "Refund",
      amount,
      currency: "AED",
      method: pick(["Wallet", "Card"] as PaymentMethod[], i),
      cardBrand: null,
      status: "Refunded",
      gatewayResponseCode: "000 - Refund Approved",
      createdAt,
      processedAt: subMinutes(new Date(createdAt), -1).toISOString(),
      completedAt: subMinutes(new Date(createdAt), -2).toISOString(),
      refundHistory: [],
      totalRefunded: 0,
      adminNotes: [],
    });
  }

  // Sort by createdAt descending
  return txns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
