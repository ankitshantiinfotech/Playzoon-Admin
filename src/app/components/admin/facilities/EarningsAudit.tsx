// ─── Facility Earnings Preview & Audit Trail ───────────────────
// Feature: Earnings summary stat cards + chronological audit log
// Independent loading/error states per section

import React, { useState, useEffect } from "react";
import {
  DollarSign, TrendingUp, Hash, Receipt, Percent,
  CalendarCheck, Repeat, GraduationCap, History,
  RefreshCw, AlertCircle, ChevronRight, ChevronDown, ChevronUp,
  Edit2, ArrowUpDown,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../../lib/utils";
import type { FacilityEarnings } from "./types";

// ─── Types ──────────────────────────────────────────────────────

export interface BookingBreakdown {
  perSession:   number;
  subscription: number;
  fullCourse:   number;
}

export interface AuditEntry {
  id:        string;
  field:     string;
  oldValue:  string;
  newValue:  string;
  changedBy: string;
  changedAt: string;
}

type SortField = "field" | "changedAt" | "changedBy";
type SortDir   = "asc" | "desc";

// ─── Mock Booking Breakdown ─────────────────────────────────────

const MOCK_BREAKDOWN: BookingBreakdown = {
  perSession:   312,
  subscription: 85,
  fullCourse:   45,
};

// ─── Skeleton Components ────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gray-200" />
        <div className="h-3 w-24 bg-gray-200 rounded" />
      </div>
      <div className="h-6 w-32 bg-gray-100 rounded mt-1" />
    </div>
  );
}

function AuditTableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 h-10" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-100">
            <div className="h-3 w-28 bg-gray-100 rounded" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
            <div className="h-3 w-32 bg-gray-100 rounded" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Error State ────────────────────────────────────────────────

function SectionError({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-red-500" />
      </div>
      <p className="text-sm text-gray-700">Unable to load {label}.</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 bg-[#003B95] text-white rounded-xl text-sm font-semibold hover:bg-[#002d75] transition-colors"
      >
        <RefreshCw className="w-4 h-4" />Retry
      </button>
    </div>
  );
}

// ─── Empty States ───────────────────────────────────────────────

function EmptyEarnings() {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
      <DollarSign className="w-10 h-10 text-gray-200" />
      <p className="text-sm">No earnings data available.</p>
    </div>
  );
}

function EmptyAudit() {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
      <History className="w-10 h-10 text-gray-200" />
      <p className="text-sm">No audit history available.</p>
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, subtitle, iconBg, iconColor, valueCls,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle?: string;
  iconBg: string;
  iconColor: string;
  valueCls?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-2.5 mb-2">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
          <Icon className={cn("w-4 h-4", iconColor)} />
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn("text-lg font-bold tabular-nums", valueCls || "text-gray-900")}>{value}</p>
      {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

// ─── Booking Breakdown Card ─────────────────────────────────────

function BreakdownCard({
  icon: Icon, label, count, color,
}: {
  icon: React.ElementType; label: string; count: number; color: string;
}) {
  return (
    <div className={cn("rounded-xl p-3 border", color)}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-bold tabular-nums">{count.toLocaleString()}</p>
    </div>
  );
}

// ─── Earnings Preview Section ───────────────────────────────────

function EarningsPreview({
  earnings,
  breakdown,
}: {
  earnings: FacilityEarnings;
  breakdown: BookingBreakdown;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const loadData = () => {
    setError(false);
    setLoading(true);
    setTimeout(() => setLoading(false), 1200);
  };

  useEffect(() => { loadData(); }, []);

  const fmt = (n: number) =>
    n.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const hasNoEarnings =
    earnings.grossRevenue === 0 &&
    earnings.totalBookings === 0 &&
    earnings.commission === 0 &&
    earnings.taxCollected === 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Earnings Preview</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Financial summary computed from booking &amp; payment data.</p>
          </div>
        </div>
        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg font-medium">
          Read-only
        </span>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <SectionError label="Earnings" onRetry={loadData} />
        ) : hasNoEarnings ? (
          <EmptyEarnings />
        ) : (
          <div className="space-y-5">
            {/* Primary stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard
                icon={DollarSign}
                label="Total Revenue"
                value={`${earnings.currency} ${fmt(earnings.grossRevenue)}`}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                valueCls="text-gray-900"
              />
              <StatCard
                icon={Hash}
                label="Total Bookings"
                value={earnings.totalBookings.toLocaleString()}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                valueCls="text-blue-700"
              />
              <StatCard
                icon={Percent}
                label="Admin Commission"
                value={`${earnings.currency} ${fmt(earnings.commission)}`}
                subtitle={`${earnings.commissionPct}% commission rate`}
                iconBg="bg-violet-50"
                iconColor="text-violet-600"
                valueCls="text-violet-700"
              />
              <StatCard
                icon={Receipt}
                label="Tax Collected"
                value={`${earnings.currency} ${fmt(earnings.taxCollected)}`}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                valueCls="text-amber-700"
              />
              <StatCard
                icon={TrendingUp}
                label="Net Provider Earnings"
                value={`${earnings.currency} ${fmt(earnings.netProviderEarnings)}`}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                valueCls="text-emerald-700"
              />
            </div>

            {/* Booking Breakdown */}
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <CalendarCheck className="w-3.5 h-3.5" />
                Booking Breakdown by Type
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <BreakdownCard
                  icon={CalendarCheck}
                  label="Per Session"
                  count={breakdown.perSession}
                  color="bg-blue-50 text-blue-700 border-blue-200"
                />
                <BreakdownCard
                  icon={Repeat}
                  label="Subscription"
                  count={breakdown.subscription}
                  color="bg-violet-50 text-violet-700 border-violet-200"
                />
                <BreakdownCard
                  icon={GraduationCap}
                  label="Full Course"
                  count={breakdown.fullCourse}
                  color="bg-teal-50 text-teal-700 border-teal-200"
                />
              </div>
            </div>

            {/* Secondary performance metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                <p className="text-[10px] text-emerald-600 uppercase font-semibold">Completed Sessions</p>
                <p className="text-lg font-bold text-emerald-700 mt-1 tabular-nums">{earnings.completedSessions.toLocaleString()}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 border border-red-200">
                <p className="text-[10px] text-red-500 uppercase font-semibold">Cancelled Sessions</p>
                <p className="text-lg font-bold text-red-700 mt-1 tabular-nums">{earnings.cancelledSessions}</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                <p className="text-[10px] text-amber-600 uppercase font-semibold">Refund Total</p>
                <p className="text-sm font-bold text-amber-700 mt-1 tabular-nums">{earnings.currency} {fmt(earnings.refundTotal)}</p>
              </div>
              <div className={cn("rounded-xl p-3 border",
                earnings.avgOccupancyRate >= 70 ? "bg-emerald-50 border-emerald-200"
                : earnings.avgOccupancyRate >= 40 ? "bg-amber-50 border-amber-200"
                : "bg-red-50 border-red-200"
              )}>
                <p className="text-[10px] text-gray-600 uppercase font-semibold">Avg Occupancy</p>
                <p className={cn("text-lg font-bold mt-1 tabular-nums",
                  earnings.avgOccupancyRate >= 70 ? "text-emerald-700"
                  : earnings.avgOccupancyRate >= 40 ? "text-amber-700"
                  : "text-red-700"
                )}>
                  {earnings.avgOccupancyRate}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Audit Trail Table Section ──────────────────────────────────

function AuditTrailTable({ entries }: { entries: AuditEntry[] }) {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [sortField, setSortField] = useState<SortField>("changedAt");
  const [sortDir, setSortDir]     = useState<SortDir>("desc");
  const [page, setPage]           = useState(0);
  const PAGE_SIZE = 10;

  const loadData = () => {
    setError(false);
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  useEffect(() => { loadData(); }, []);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir(field === "changedAt" ? "desc" : "asc");
    }
    setPage(0);
  };

  const sorted = [...entries].sort((a, b) => {
    let cmp = 0;
    if (sortField === "changedAt") {
      cmp = new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime();
    } else if (sortField === "field") {
      cmp = a.field.localeCompare(b.field);
    } else {
      cmp = a.changedBy.localeCompare(b.changedBy);
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated  = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 text-[#003B95]" />
      : <ChevronDown className="w-3 h-3 text-[#003B95]" />;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#003B95]/10 flex items-center justify-center shrink-0">
            <History className="w-4 h-4 text-[#003B95]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Audit Trail</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Chronological log of all field-level changes.</p>
          </div>
        </div>
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
          {entries.length} entr{entries.length !== 1 ? "ies" : "y"}
        </span>
      </div>

      <div className="p-5">
        {loading ? (
          <AuditTableSkeleton />
        ) : error ? (
          <SectionError label="Audit Trail" onRetry={loadData} />
        ) : entries.length === 0 ? (
          <EmptyAudit />
        ) : (
          <div>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th
                      className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => toggleSort("field")}
                    >
                      <span className="flex items-center gap-1">
                        Field Changed <SortIcon field="field" />
                      </span>
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                      Old Value
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                      New Value
                    </th>
                    <th
                      className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => toggleSort("changedAt")}
                    >
                      <span className="flex items-center gap-1">
                        Date &amp; Time <SortIcon field="changedAt" />
                      </span>
                    </th>
                    <th
                      className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => toggleSort("changedBy")}
                    >
                      <span className="flex items-center gap-1">
                        Changed By <SortIcon field="changedBy" />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          <Edit2 className="w-3 h-3 text-[#003B95] shrink-0" />
                          <span className="font-semibold text-gray-800">{entry.field}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[12px] bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-md line-through inline-block max-w-[160px] truncate">
                          {entry.oldValue || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[12px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold inline-block max-w-[160px] truncate">
                          {entry.newValue}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 tabular-nums whitespace-nowrap">
                        {format(new Date(entry.changedAt), "dd MMM yyyy, HH:mm")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-[#003B95]">{entry.changedBy}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={cn(
                        "w-7 h-7 text-xs font-medium rounded-lg transition-colors",
                        page === i
                          ? "bg-[#003B95] text-white"
                          : "border border-gray-200 hover:bg-gray-50 text-gray-600"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={page === totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Combined Export ────────────────────────────────────────────

export function EarningsAuditSection({
  earnings,
  auditEntries,
}: {
  earnings: FacilityEarnings;
  auditEntries: AuditEntry[];
}) {
  return (
    <div className="space-y-5">
      <EarningsPreview earnings={earnings} breakdown={MOCK_BREAKDOWN} />
      <AuditTrailTable entries={auditEntries} />
    </div>
  );
}
