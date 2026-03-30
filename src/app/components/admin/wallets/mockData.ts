// ─── SCR-ADM-047: Wallet Management — Mock Data ─────────────────────────────

import type { WalletEntry, WalletTransaction } from "./types";

export const MOCK_WALLETS: WalletEntry[] = [
  {
    id: "WAL-001",
    user: { id: "USR-001", name: "Ahmed Al-Rashidi", email: "ahmed.rashidi@gmail.com" },
    userType: "Player",
    status: "Active",
    availableBalance: 350.00,
    lockedBalance: 100.00,
    lifetimeAmount: 2450.00,
    lastTransactionDate: "2026-02-20T14:30:00Z",
  },
  {
    id: "WAL-002",
    user: { id: "USR-002", name: "Sarah Johnson", email: "sarah.j@outlook.com" },
    userType: "Player",
    status: "Active",
    availableBalance: 1250.00,
    lockedBalance: 200.00,
    lifetimeAmount: 4800.00,
    lastTransactionDate: "2026-02-21T09:15:00Z",
  },
  {
    id: "WAL-003",
    user: { id: "USR-003", name: "Al Wasl Sports Complex", email: "admin@alwaslsports.ae" },
    userType: "Facility Provider",
    status: "Active",
    availableBalance: 12500.00,
    lockedBalance: 3200.00,
    lifetimeAmount: 85000.00,
    lastTransactionDate: "2026-02-21T11:00:00Z",
  },
  {
    id: "WAL-004",
    user: { id: "USR-004", name: "Elite Training Academy", email: "finance@elitetraining.sa" },
    userType: "Training Provider",
    status: "Active",
    availableBalance: 8750.00,
    lockedBalance: 1500.00,
    lifetimeAmount: 42000.00,
    lastTransactionDate: "2026-02-20T16:45:00Z",
  },
  {
    id: "WAL-005",
    user: { id: "USR-005", name: "Coach Khalid Al-Mansouri", email: "k.mansouri@icloud.com" },
    userType: "Coach",
    status: "Active",
    availableBalance: -250.00,
    lockedBalance: 0,
    lifetimeAmount: 15000.00,
    lastTransactionDate: "2026-02-19T08:30:00Z",
  },
  {
    id: "WAL-006",
    user: { id: "USR-006", name: "Jessica Martinez", email: "jess.martinez@gmail.com" },
    userType: "Player",
    status: "Frozen",
    availableBalance: 180.00,
    lockedBalance: 0,
    lifetimeAmount: 920.00,
    lastTransactionDate: "2026-02-10T13:20:00Z",
  },
  {
    id: "WAL-007",
    user: { id: "USR-005", name: "Coach Khalid Al-Mansouri", email: "k.mansouri@icloud.com" },
    userType: "Player",
    status: "Active",
    availableBalance: 75.00,
    lockedBalance: 0,
    lifetimeAmount: 500.00,
    lastTransactionDate: "2026-02-18T11:00:00Z",
  },
  {
    id: "WAL-008",
    user: { id: "USR-008", name: "Priya Nair", email: "priya.nair@yahoo.com" },
    userType: "Player",
    status: "Active",
    availableBalance: 0.00,
    lockedBalance: 150.00,
    lifetimeAmount: 1200.00,
    lastTransactionDate: "2026-02-19T16:45:00Z",
  },
  {
    id: "WAL-009",
    user: { id: "USR-009", name: "Dubai Sports City", email: "ops@dubaisportscity.ae" },
    userType: "Facility Provider",
    status: "Active",
    availableBalance: 24300.00,
    lockedBalance: 5100.00,
    lifetimeAmount: 120000.00,
    lastTransactionDate: "2026-02-21T07:30:00Z",
  },
  {
    id: "WAL-010",
    user: { id: "USR-010", name: "Coach Fatima Al-Zaabi", email: "fatima.coach@gmail.com" },
    userType: "Coach",
    status: "Active",
    availableBalance: 3200.00,
    lockedBalance: 800.00,
    lifetimeAmount: 28000.00,
    lastTransactionDate: "2026-02-20T10:00:00Z",
  },
  {
    id: "WAL-011",
    user: { id: "USR-011", name: "Mohammed Al-Qassimi", email: "mq.sports@gmail.com" },
    userType: "Player",
    status: "Active",
    availableBalance: 4500.00,
    lockedBalance: 1000.00,
    lifetimeAmount: 15800.00,
    lastTransactionDate: "2026-02-21T11:45:00Z",
  },
  {
    id: "WAL-012",
    user: { id: "USR-012", name: "Sharjah Sports Academy", email: "admin@sharjahsports.ae" },
    userType: "Training Provider",
    status: "Frozen",
    availableBalance: 1800.00,
    lockedBalance: 0,
    lifetimeAmount: 18500.00,
    lastTransactionDate: "2026-01-15T09:00:00Z",
  },
];

// ─── Per-Wallet Transaction Histories ────────────────────────────────────────

const ALL_TXS: WalletTransaction[] = [
  // WAL-001
  { id: "TX-001", walletId: "WAL-001", type: "Add Money", description: "Wallet top-up via card", amount: 200.00, balanceAfter: 200.00, date: "2026-01-10T09:00:00Z", isCredit: true },
  { id: "TX-002", walletId: "WAL-001", type: "Facility Payment", description: "Football pitch - Al Wasl Sports Complex", amount: -80.00, balanceAfter: 120.00, date: "2026-01-12T11:30:00Z", isCredit: false },
  { id: "TX-003", walletId: "WAL-001", type: "Refund", description: "Refund for cancelled booking #BKG-4410", amount: 50.00, balanceAfter: 170.00, date: "2026-01-15T14:00:00Z", isCredit: true },
  { id: "TX-004", walletId: "WAL-001", type: "Add Money", description: "Wallet top-up via Apple Pay", amount: 300.00, balanceAfter: 470.00, date: "2026-01-20T08:00:00Z", isCredit: true },
  { id: "TX-005", walletId: "WAL-001", type: "Admin Manual Adjustment", description: "Compensation for failed booking experience", amount: 50.00, balanceAfter: 520.00, date: "2026-01-25T10:00:00Z", isCredit: true },
  { id: "TX-006", walletId: "WAL-001", type: "Facility Payment", description: "Tennis court - Elite Sports Club (1.5 hrs)", amount: -120.00, balanceAfter: 400.00, date: "2026-02-03T09:00:00Z", isCredit: false },
  { id: "TX-007", walletId: "WAL-001", type: "Reserved Hold", description: "Football pitch - Reserved (upcoming session)", amount: -50.00, balanceAfter: 350.00, date: "2026-02-20T14:30:00Z", isCredit: false },

  // WAL-003
  { id: "TX-010", walletId: "WAL-003", type: "Booking Earnings", description: "Football pitch booking earnings", amount: 800.00, balanceAfter: 12500.00, date: "2026-02-21T11:00:00Z", isCredit: true },
  { id: "TX-011", walletId: "WAL-003", type: "Commission Deduction", description: "Platform commission (12%)", amount: -108.00, balanceAfter: 12392.00, date: "2026-02-21T11:00:00Z", isCredit: false },
  { id: "TX-012", walletId: "WAL-003", type: "Payout Deduction", description: "Payout processed - PO-2045", amount: -5000.00, balanceAfter: 7392.00, date: "2026-02-15T09:00:00Z", isCredit: false },

  // WAL-005 (negative balance coach)
  { id: "TX-020", walletId: "WAL-005", type: "Booking Earnings", description: "Personal training session", amount: 350.00, balanceAfter: 350.00, date: "2026-02-10T14:00:00Z", isCredit: true },
  { id: "TX-021", walletId: "WAL-005", type: "Cancellation Penalty", description: "Late cancellation penalty - BKG-5890", amount: -600.00, balanceAfter: -250.00, date: "2026-02-19T08:30:00Z", isCredit: false },

  // WAL-006 (frozen)
  { id: "TX-030", walletId: "WAL-006", type: "Add Money", description: "Wallet top-up", amount: 500.00, balanceAfter: 500.00, date: "2025-12-10T10:00:00Z", isCredit: true },
  { id: "TX-031", walletId: "WAL-006", type: "Facility Payment", description: "Padel court booking", amount: -200.00, balanceAfter: 300.00, date: "2025-12-20T14:00:00Z", isCredit: false },
  { id: "TX-032", walletId: "WAL-006", type: "Facility Payment", description: "Squash court booking", amount: -120.00, balanceAfter: 180.00, date: "2026-01-05T11:00:00Z", isCredit: false },
];

export function getWalletTransactions(walletId: string): WalletTransaction[] {
  return ALL_TXS
    .filter((t) => t.walletId === walletId)
    .sort((a, b) => b.date.localeCompare(a.date));
}
