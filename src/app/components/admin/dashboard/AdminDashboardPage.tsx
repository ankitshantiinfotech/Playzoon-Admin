import { useState } from "react";
import { Link } from "react-router";
import {
  AlertTriangle,
  X,
  Shield,
  Mail,
  Clock,
  UserCog,
  CheckCircle2,
  TrendingUp,
  Users,
  CalendarCheck,
  Trophy,
  UserCheck,
  XCircle,
  Banknote,
  Wallet,
  HeadphonesIcon,
  UserMinus,
  Bell,
  ClipboardList,
  ExternalLink,
  Dumbbell,
  Building2,
  ArrowRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Badge } from "../../ui/badge";

import { KPIGrid } from "./KPIGrid";

// ─── Mock Data ───────────────────────────────────────────────────────────────

const RECONCILIATION_MISMATCHES = 3;

const ADMIN_PROFILE = {
  name: "Sultan Al-Rashid",
  email: "sultan.admin@playzoon.com",
  lastLogin: "2026-03-10T08:15:00Z",
  role: "Super Admin",
  status: "Active",
};

const QUICK_STATS = [
  {
    label: "Monthly Revenue",
    value: "SAR 485,200",
    icon: TrendingUp,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
  },
  {
    label: "Active Users",
    value: "8,421",
    icon: Users,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
  },
  {
    label: "Total Bookings",
    value: "34,291",
    icon: CalendarCheck,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-100",
  },
  {
    label: "Total Tournaments",
    value: "2,156",
    icon: Trophy,
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-100",
  },
  {
    label: "Total Coaches",
    value: "100",
    icon: UserCheck,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
  },
  {
    label: "Failed/Cancelled Bookings",
    value: "1,247",
    icon: XCircle,
    iconColor: "text-red-600",
    iconBg: "bg-red-100",
  },
];

const RECENT_TRANSACTIONS = [
  {
    txnId: "TXN-10042",
    bookingId: "BK-8821",
    type: "Facility",
    schedule: "2026-03-09 14:00",
    amount: 350,
    commission: 52.5,
    tax: 17.85,
  },
  {
    txnId: "TXN-10041",
    bookingId: "BK-8820",
    type: "Coach",
    schedule: "2026-03-09 10:00",
    amount: 200,
    commission: 30,
    tax: 10.5,
  },
  {
    txnId: "TXN-10040",
    bookingId: "BK-8819",
    type: "Tournament",
    schedule: "2026-03-08 18:00",
    amount: 500,
    commission: 75,
    tax: 26.25,
  },
  {
    txnId: "TXN-10039",
    bookingId: "BK-8818",
    type: "Training",
    schedule: "2026-03-08 09:00",
    amount: 180,
    commission: 27,
    tax: 9.45,
  },
  {
    txnId: "TXN-10038",
    bookingId: "BK-8817",
    type: "Facility",
    schedule: "2026-03-07 16:00",
    amount: 420,
    commission: 63,
    tax: 22.05,
  },
  {
    txnId: "TXN-10037",
    bookingId: "BK-8816",
    type: "Coach",
    schedule: "2026-03-07 11:00",
    amount: 250,
    commission: 37.5,
    tax: 13.13,
  },
  {
    txnId: "TXN-10036",
    bookingId: "BK-8815",
    type: "Facility",
    schedule: "2026-03-06 15:00",
    amount: 300,
    commission: 45,
    tax: 15.75,
  },
  {
    txnId: "TXN-10035",
    bookingId: "BK-8814",
    type: "Tournament",
    schedule: "2026-03-06 08:00",
    amount: 600,
    commission: 90,
    tax: 31.5,
  },
  {
    txnId: "TXN-10034",
    bookingId: "BK-8813",
    type: "Training",
    schedule: "2026-03-05 17:00",
    amount: 150,
    commission: 22.5,
    tax: 7.88,
  },
  {
    txnId: "TXN-10033",
    bookingId: "BK-8812",
    type: "Coach",
    schedule: "2026-03-05 12:00",
    amount: 275,
    commission: 41.25,
    tax: 14.44,
  },
];

const TOP_ENTITIES = [
  {
    name: "Central Sports Arena",
    bookings: 1240,
    amount: 186000,
    link: "/providers/1",
  },
  {
    name: "Green Turf Stadium",
    bookings: 980,
    amount: 147000,
    link: "/providers/2",
  },
  {
    name: "Elite Fitness Academy",
    bookings: 870,
    amount: 130500,
    link: "/providers/3",
  },
  {
    name: "Royal Tennis Club",
    bookings: 720,
    amount: 108000,
    link: "/providers/4",
  },
  {
    name: "Champion Swimming Pool",
    bookings: 650,
    amount: 97500,
    link: "/providers/5",
  },
];

const BOOKING_METRICS = [
  { label: "Total Bookings", value: "34,291" },
  { label: "Tournament Bookings", value: "8,540" },
  { label: "Coach Bookings", value: "6,320" },
  { label: "Training Bookings", value: "9,180" },
  { label: "Facility Bookings", value: "10,251" },
];

const PAYOUT_METRICS = [
  { label: "Total Processed Payouts", value: "SAR 2,145,800" },
  { label: "Pending Payouts", value: "SAR 82,500" },
  { label: "Open Support Tickets", value: "23" },
  { label: "Deactivations/Deletions", value: "47" },
];

const NOTIFICATIONS = [
  {
    id: 1,
    title: "New provider application: Riyadh Sports Hub",
    timestamp: "2026-03-10T09:45:00Z",
  },
  {
    id: 2,
    title: "Payout request pending approval (SAR 12,500)",
    timestamp: "2026-03-10T09:30:00Z",
  },
  {
    id: 3,
    title: "User complaint escalated - Booking #BK-8801",
    timestamp: "2026-03-10T08:55:00Z",
  },
  {
    id: 4,
    title: "System maintenance scheduled for tonight 02:00 UTC",
    timestamp: "2026-03-10T08:20:00Z",
  },
  {
    id: 5,
    title: "Monthly revenue report is ready for review",
    timestamp: "2026-03-10T07:00:00Z",
  },
];

const AUDIT_LOG = [
  {
    id: 1,
    action: "Approved Provider",
    actor: "Sultan Al-Rashid",
    target: "Riyadh Fitness Center",
    timestamp: "2026-03-10T09:42:00Z",
  },
  {
    id: 2,
    action: "Processed Payout",
    actor: "Sultan Al-Rashid",
    target: "Green Turf Stadium",
    timestamp: "2026-03-10T09:30:00Z",
  },
  {
    id: 3,
    action: "Updated Commission",
    actor: "Fatima Al-Zahrani",
    target: "Coach Category",
    timestamp: "2026-03-10T09:15:00Z",
  },
  {
    id: 4,
    action: "Deactivated User",
    actor: "Sultan Al-Rashid",
    target: "User #U-4521",
    timestamp: "2026-03-10T08:50:00Z",
  },
  {
    id: 5,
    action: "Resolved Ticket",
    actor: "Fatima Al-Zahrani",
    target: "Ticket #T-1102",
    timestamp: "2026-03-10T08:30:00Z",
  },
  {
    id: 6,
    action: "Created Promotion",
    actor: "Sultan Al-Rashid",
    target: "Summer Discount 2026",
    timestamp: "2026-03-10T08:00:00Z",
  },
  {
    id: 7,
    action: "Approved Provider",
    actor: "Fatima Al-Zahrani",
    target: "Elite Swimming Academy",
    timestamp: "2026-03-09T18:45:00Z",
  },
  {
    id: 8,
    action: "Exported Report",
    actor: "Sultan Al-Rashid",
    target: "Monthly Revenue Mar 2026",
    timestamp: "2026-03-09T17:30:00Z",
  },
  {
    id: 9,
    action: "Updated Settings",
    actor: "Sultan Al-Rashid",
    target: "Tax Configuration",
    timestamp: "2026-03-09T16:00:00Z",
  },
  {
    id: 10,
    action: "Rejected Provider",
    actor: "Fatima Al-Zahrani",
    target: "Invalid Sports LLC",
    timestamp: "2026-03-09T14:20:00Z",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatUTCTimestamp(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }) + " UTC"
  );
}

function formatSAR(value: number) {
  return `SAR ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AdminDashboardPage() {
  const [showAlert, setShowAlert] = useState(RECONCILIATION_MISMATCHES > 0);

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Dashboard</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Welcome back! Here's what's happening on Playzoon today.
        </p>
      </div>

      {/* ── Row 1: Reconciliation Alert Banner ── */}
      {showAlert && RECONCILIATION_MISMATCHES > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-5 py-3.5 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-amber-100">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-sm font-medium text-amber-800">
              {RECONCILIATION_MISMATCHES} payment reconciliation mismatches
              detected.
              <Link
                to="/transactions?filter=mismatched"
                className="ml-2 text-[#003B95] font-semibold hover:underline inline-flex items-center gap-1"
              >
                View Details
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </p>
          </div>
          <button
            onClick={() => setShowAlert(false)}
            className="p-1 rounded-md hover:bg-amber-100 transition-colors text-amber-600"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Row 2: Summary Count Cards (6 cards) ── */}
      <KPIGrid />

      {/* ── Row 3: Admin Profile + Quick Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Admin Profile Widget (40%) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-full bg-[#003B95] flex items-center justify-center text-white text-sm font-bold">
              {ADMIN_PROFILE.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#111827]">
                Admin Profile
              </h3>
              <p className="text-xs text-[#6B7280]">Account Information</p>
            </div>
          </div>
          <div className="space-y-3.5">
            <div className="flex items-center gap-3">
              <UserCog className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
              <span className="text-sm text-[#6B7280] w-24">Name</span>
              <span className="text-sm font-medium text-[#111827]">
                {ADMIN_PROFILE.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
              <span className="text-sm text-[#6B7280] w-24">Email</span>
              <span className="text-sm font-medium text-[#111827]">
                {ADMIN_PROFILE.email}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
              <span className="text-sm text-[#6B7280] w-24">Last Login</span>
              <span className="text-sm font-medium text-[#111827]">
                {formatUTCTimestamp(ADMIN_PROFILE.lastLogin)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
              <span className="text-sm text-[#6B7280] w-24">Role</span>
              <Badge className="bg-[#003B95]/10 text-[#003B95] border-[#003B95]/20 text-xs">
                {ADMIN_PROFILE.role}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
              <span className="text-sm text-[#6B7280] w-24">Status</span>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                {ADMIN_PROFILE.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid (60%) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#111827] mb-4">
            Quick Stats
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {QUICK_STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-md ${stat.iconBg} flex items-center justify-center`}
                    >
                      <Icon className={`w-4 h-4 ${stat.iconColor}`} />
                    </div>
                    <span className="text-xs text-[#6B7280] font-medium leading-tight">
                      {stat.label}
                    </span>
                  </div>
                  <span className="text-xl font-bold text-[#111827]">
                    {stat.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 4: Recent Transactions + Top 5 Entities ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Recent Transactions (60%) */}
        <div className="xl:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#111827]">
              Recent Transactions
            </h3>
            <Link
              to="/transactions"
              className="text-sm font-medium text-[#003B95] hover:underline flex items-center gap-1"
            >
              View All Transactions
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs text-[#6B7280] font-semibold px-4">
                    Transaction ID
                  </TableHead>
                  <TableHead className="text-xs text-[#6B7280] font-semibold px-4">
                    Booking ID
                  </TableHead>
                  <TableHead className="text-xs text-[#6B7280] font-semibold px-4">
                    Booking Type
                  </TableHead>
                  <TableHead className="text-xs text-[#6B7280] font-semibold px-4">
                    Schedule
                  </TableHead>
                  <TableHead className="text-xs text-[#6B7280] font-semibold px-4 text-right">
                    Amount (SAR)
                  </TableHead>
                  <TableHead className="text-xs text-[#6B7280] font-semibold px-4 text-right">
                    Commission (SAR)
                  </TableHead>
                  <TableHead className="text-xs text-[#6B7280] font-semibold px-4 text-right">
                    Tax (SAR)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RECENT_TRANSACTIONS.map((txn) => (
                  <TableRow key={txn.txnId} className="hover:bg-gray-50/50">
                    <TableCell className="px-4">
                      <Link
                        to={`/transactions/${txn.txnId}`}
                        className="text-sm font-medium text-[#003B95] hover:underline"
                      >
                        {txn.txnId}
                      </Link>
                    </TableCell>
                    <TableCell className="px-4">
                      <Link
                        to={`/bookings/${txn.bookingId}`}
                        className="text-sm text-[#003B95] hover:underline"
                      >
                        {txn.bookingId}
                      </Link>
                    </TableCell>
                    <TableCell className="px-4">
                      <Badge
                        className={`text-xs font-medium ${
                          txn.type === "Facility"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : txn.type === "Coach"
                              ? "bg-amber-100 text-amber-700 border-amber-200"
                              : txn.type === "Tournament"
                                ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                                : "bg-purple-100 text-purple-700 border-purple-200"
                        }`}
                      >
                        {txn.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 text-sm text-[#6B7280]">
                      {txn.schedule}
                    </TableCell>
                    <TableCell className="px-4 text-sm text-[#111827] font-medium text-right">
                      {formatSAR(txn.amount)}
                    </TableCell>
                    <TableCell className="px-4 text-sm text-[#111827] text-right">
                      {formatSAR(txn.commission)}
                    </TableCell>
                    <TableCell className="px-4 text-sm text-[#111827] text-right">
                      {formatSAR(txn.tax)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Top 5 Entities (40%) */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-[#111827]">
              Top 5 Entities
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Sorted by total amount (descending)
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="text-xs text-[#6B7280] font-semibold px-4">
                  Entity Name
                </TableHead>
                <TableHead className="text-xs text-[#6B7280] font-semibold px-4 text-right">
                  Total Bookings
                </TableHead>
                <TableHead className="text-xs text-[#6B7280] font-semibold px-4 text-right">
                  Total Amount (SAR)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TOP_ENTITIES.map((entity, idx) => (
                <TableRow key={entity.name} className="hover:bg-gray-50/50">
                  <TableCell className="px-4">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-gray-100 text-[10px] font-bold text-[#6B7280] flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <Link
                        to={entity.link}
                        className="text-sm font-medium text-[#003B95] hover:underline"
                      >
                        {entity.name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 text-sm text-[#111827] font-medium text-right">
                    {entity.bookings.toLocaleString()}
                  </TableCell>
                  <TableCell className="px-4 text-sm text-[#111827] font-medium text-right">
                    {formatSAR(entity.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Row 5: Booking Metrics + Payout Metrics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Metrics */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarCheck className="w-5 h-5 text-[#003B95]" />
            <h3 className="text-lg font-semibold text-[#111827]">
              Booking Metrics
            </h3>
          </div>
          <div className="space-y-0 divide-y divide-gray-100">
            {BOOKING_METRICS.map((item, idx) => {
              const icons = [
                CalendarCheck,
                Trophy,
                UserCheck,
                Dumbbell,
                Building2,
              ];
              const IconItem = icons[idx];
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center">
                      <IconItem className="w-4 h-4 text-[#6B7280]" />
                    </div>
                    <span className="text-sm text-[#111827]">{item.label}</span>
                  </div>
                  <span
                    className={`text-sm font-bold ${idx === 0 ? "text-[#003B95]" : "text-[#111827]"}`}
                  >
                    {item.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payout Metrics */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-[#003B95]" />
            <h3 className="text-lg font-semibold text-[#111827]">
              Payout Metrics
            </h3>
          </div>
          <div className="space-y-0 divide-y divide-gray-100">
            {PAYOUT_METRICS.map((item, idx) => {
              const icons = [Banknote, Wallet, HeadphonesIcon, UserMinus];
              const IconItem = icons[idx];
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center">
                      <IconItem className="w-4 h-4 text-[#6B7280]" />
                    </div>
                    <span className="text-sm text-[#111827]">{item.label}</span>
                  </div>
                  <span
                    className={`text-sm font-bold ${idx === 0 ? "text-emerald-600" : idx === 1 ? "text-amber-600" : "text-[#111827]"}`}
                  >
                    {item.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 6: Notifications + Audit Log ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#003B95]" />
              <h3 className="text-lg font-semibold text-[#111827]">
                Notifications
              </h3>
              <span className="ml-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {NOTIFICATIONS.length}
              </span>
            </div>
            <Link
              to="/notifications"
              className="text-sm font-medium text-[#003B95] hover:underline flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {NOTIFICATIONS.map((notification) => (
              <div
                key={notification.id}
                className="px-5 py-3.5 hover:bg-gray-50 transition-colors flex items-start gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-[#003B95] mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#111827] font-medium leading-snug">
                    {notification.title}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    {formatUTCTimestamp(notification.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#003B95]" />
              <h3 className="text-lg font-semibold text-[#111827]">
                Recent Audit Log
              </h3>
            </div>
            <Link
              to="/audit-log"
              className="text-sm font-medium text-[#003B95] hover:underline flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs text-[#6B7280] font-semibold px-4">
                    Action
                  </TableHead>
                  <TableHead className="text-xs text-[#6B7280] font-semibold px-4">
                    Actor
                  </TableHead>
                  <TableHead className="text-xs text-[#6B7280] font-semibold px-4">
                    Target
                  </TableHead>
                  <TableHead className="text-xs text-[#6B7280] font-semibold px-4">
                    Timestamp (UTC)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {AUDIT_LOG.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-gray-50/50">
                    <TableCell className="px-4">
                      <span className="text-sm font-medium text-[#111827]">
                        {entry.action}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 text-sm text-[#6B7280]">
                      {entry.actor}
                    </TableCell>
                    <TableCell className="px-4 text-sm text-[#6B7280]">
                      {entry.target}
                    </TableCell>
                    <TableCell className="px-4 text-xs text-[#6B7280]">
                      {formatUTCTimestamp(entry.timestamp)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
