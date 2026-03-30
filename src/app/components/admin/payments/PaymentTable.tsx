// ─── US-102 Payment Table with Full Filters ───────────────────────────────────
import { useState, useMemo } from "react";
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import {
  Search, SlidersHorizontal, ChevronLeft, ChevronRight, Eye,
  CreditCard, Wallet, Smartphone, ArrowUp, ArrowDown, Download, X,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { PaymentTransaction, PaymentFilters, DEFAULT_FILTERS, PaymentStatus, PaymentMethod, TransactionType } from "./types";

const STATUS_CFG: Record<PaymentStatus, { label: string; cls: string }> = {
  Success:            { label: "Success",         cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  Failed:             { label: "Failed",          cls: "bg-red-50 text-red-700 border-red-100"             },
  Pending:            { label: "Pending",         cls: "bg-amber-50 text-amber-700 border-amber-100"       },
  Refunded:           { label: "Refunded",        cls: "bg-violet-50 text-violet-700 border-violet-100"    },
  "Refund Initiated": { label: "Refund Init.",    cls: "bg-blue-50 text-blue-700 border-blue-100"          },
  Resolved:           { label: "Resolved",        cls: "bg-teal-50 text-teal-700 border-teal-100"          },
};

const TYPE_CFG: Record<TransactionType, string> = {
  "Booking Payment": "bg-[#003B95]/10 text-[#003B95]",
  "Wallet Top-Up":   "bg-emerald-100 text-emerald-700",
  "Refund":          "bg-violet-100 text-violet-700",
  "Payout":          "bg-amber-100 text-amber-700",
};

function MethodIcon({ method }: { method: string }) {
  if (["Apple Pay", "Google Pay", "STC Pay"].includes(method)) return <Smartphone className="h-3.5 w-3.5 text-gray-400 shrink-0" />;
  if (method === "Wallet") return <Wallet className="h-3.5 w-3.5 text-gray-400 shrink-0" />;
  return <CreditCard className="h-3.5 w-3.5 text-gray-400 shrink-0" />;
}

interface Props {
  transactions: PaymentTransaction[];
  onViewDetails: (t: PaymentTransaction) => void;
}

export function PaymentTable({ transactions, onViewDetails }: Props) {
  const [filters, setFilters]     = useState<PaymentFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [sortKey, setSortKey]     = useState<"createdAt" | "amount">("createdAt");
  const [sortDir, setSortDir]     = useState<"asc" | "desc">("desc");
  const [page, setPage]           = useState(1);
  const PER_PAGE = 12;

  const setF = <K extends keyof PaymentFilters>(key: K, value: PaymentFilters[K]) => {
    setFilters((p) => ({ ...p, [key]: value }));
    setPage(1);
  };

  const activeFilterCount = [
    filters.status !== "All",
    filters.type   !== "All",
    filters.method !== "All",
    !!filters.dateFrom || !!filters.dateTo,
    !!filters.amountMin || !!filters.amountMax,
  ].filter(Boolean).length;

  const processed = useMemo(() => {
    let result = transactions.filter((t) => {
      const q = filters.search.toLowerCase();
      const matchSearch = !q ||
        t.id.toLowerCase().includes(q) ||
        t.gatewayReference.toLowerCase().includes(q) ||
        t.player.name.toLowerCase().includes(q) ||
        t.player.email.toLowerCase().includes(q) ||
        (t.provider?.name.toLowerCase().includes(q) ?? false) ||
        t.amount.toString().includes(q) ||
        (t.bookingId?.toLowerCase().includes(q) ?? false);

      const matchStatus = filters.status === "All" || t.status === filters.status;
      const matchType   = filters.type   === "All" || t.type   === filters.type;
      const matchMethod = filters.method === "All" || t.method === filters.method;

      let matchDate = true;
      if (filters.dateFrom || filters.dateTo) {
        const d = parseISO(t.createdAt);
        if (filters.dateFrom && filters.dateTo) {
          matchDate = isWithinInterval(d, { start: startOfDay(parseISO(filters.dateFrom)), end: endOfDay(parseISO(filters.dateTo)) });
        } else if (filters.dateFrom) {
          matchDate = d >= startOfDay(parseISO(filters.dateFrom));
        } else {
          matchDate = d <= endOfDay(parseISO(filters.dateTo));
        }
      }

      let matchAmt = true;
      if (filters.amountMin) matchAmt = matchAmt && t.amount >= Number(filters.amountMin);
      if (filters.amountMax) matchAmt = matchAmt && t.amount <= Number(filters.amountMax);

      return matchSearch && matchStatus && matchType && matchMethod && matchDate && matchAmt;
    });

    result.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "amount") return (a.amount - b.amount) * dir;
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
    });

    return result;
  }, [transactions, filters, sortKey, sortDir]);

  const totalPages   = Math.ceil(processed.length / PER_PAGE);
  const paginated    = processed.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSort = (key: "createdAt" | "amount") => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Gateway Ref", "Player", "Email", "Provider", "Type", "Amount (AED)", "Method", "Status", "Date"];
    const rows = processed.map((t) => [
      t.id, t.gatewayReference, t.player.name, t.player.email,
      t.provider?.name ?? "", t.type, t.amount.toFixed(2), t.method, t.status,
      format(new Date(t.createdAt), "yyyy-MM-dd HH:mm"),
    ]);
    const csv = "data:text/csv;charset=utf-8," + [headers, ...rows].map((r) => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `payment-transactions-${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SortIcon = ({ k }: { k: "createdAt" | "amount" }) => {
    if (sortKey !== k) return null;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="px-4 py-3.5 border-b border-gray-100 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search ID, player, provider, booking, amount…"
              value={filters.search}
              onChange={(e) => setF("search", e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003B95]/20 focus:border-[#003B95]"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters((p) => !p)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs transition-colors",
                showFilters || activeFilterCount > 0
                  ? "bg-[#003B95]/10 border-[#003B95]/20 text-[#003B95]"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50",
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 h-4 w-4 rounded-full bg-[#003B95] text-white text-[10px] flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {/* ── Extended Filters ─────────────────────────────────────────── */}
        {showFilters && (
          <div className="pt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 border-t border-dashed border-gray-100">
            {/* Status */}
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setF("status", e.target.value as any)}
                className="w-full text-xs border border-gray-200 rounded-lg py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-[#003B95]"
              >
                <option value="All">All Statuses</option>
                {(Object.keys(STATUS_CFG) as PaymentStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_CFG[s].label}</option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setF("type", e.target.value as any)}
                className="w-full text-xs border border-gray-200 rounded-lg py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-[#003B95]"
              >
                <option value="All">All Types</option>
                {(["Booking Payment", "Wallet Top-Up", "Refund", "Payout"] as TransactionType[]).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Method */}
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Payment Method</label>
              <select
                value={filters.method}
                onChange={(e) => setF("method", e.target.value as any)}
                className="w-full text-xs border border-gray-200 rounded-lg py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-[#003B95]"
              >
                <option value="All">All Methods</option>
                {(["Card", "Wallet", "Apple Pay", "Google Pay", "Mada", "STC Pay"] as PaymentMethod[]).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Date Range</label>
              <div className="flex items-center gap-1">
                <input type="date" value={filters.dateFrom} onChange={(e) => setF("dateFrom", e.target.value)}
                  className="flex-1 min-w-0 text-[10px] border border-gray-200 rounded-lg py-1.5 px-1.5 focus:outline-none focus:ring-1 focus:ring-[#003B95]"
                />
                <span className="text-gray-300 text-xs shrink-0">–</span>
                <input type="date" value={filters.dateTo} onChange={(e) => setF("dateTo", e.target.value)}
                  className="flex-1 min-w-0 text-[10px] border border-gray-200 rounded-lg py-1.5 px-1.5 focus:outline-none focus:ring-1 focus:ring-[#003B95]"
                />
              </div>
            </div>

            {/* Amount range */}
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Amount Range (AED)</label>
              <div className="flex items-center gap-1">
                <input type="number" placeholder="Min" value={filters.amountMin} onChange={(e) => setF("amountMin", e.target.value)}
                  className="flex-1 min-w-0 text-[10px] border border-gray-200 rounded-lg py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-[#003B95]"
                />
                <span className="text-gray-300 text-xs shrink-0">–</span>
                <input type="number" placeholder="Max" value={filters.amountMax} onChange={(e) => setF("amountMax", e.target.value)}
                  className="flex-1 min-w-0 text-[10px] border border-gray-200 rounded-lg py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-[#003B95]"
                />
              </div>
            </div>

            {/* Clear */}
            {activeFilterCount > 0 && (
              <div className="flex items-end">
                <button
                  onClick={() => { setFilters(DEFAULT_FILTERS); setPage(1); }}
                  className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" /> Clear all
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left min-w-[860px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3">TXN ID / Gateway</th>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Type</th>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:text-gray-700 select-none"
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center justify-end gap-1">Amount <SortIcon k="amount" /></div>
              </th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Status</th>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:text-gray-700 select-none"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center justify-end gap-1">Date <SortIcon k="createdAt" /></div>
              </th>
              <th className="px-4 py-3 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-xs text-gray-400">
                  No transactions match your filters.
                </td>
              </tr>
            ) : (
              paginated.map((t) => {
                const statusCfg = STATUS_CFG[t.status];
                return (
                  <tr
                    key={t.id}
                    className="hover:bg-gray-50/70 transition-colors cursor-pointer"
                    onClick={() => onViewDetails(t)}
                  >
                    {/* TXN ID */}
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-gray-900">{t.id}</p>
                      <p className="font-mono text-[10px] text-gray-400">{t.gatewayReference}</p>
                    </td>

                    {/* Player */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={t.player.avatar} alt={t.player.name} className="h-6 w-6 rounded-full object-cover bg-gray-100 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-900 truncate max-w-[120px]">{t.player.name}</p>
                          <p className="text-[10px] text-gray-400 truncate max-w-[120px]">{t.player.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Provider */}
                    <td className="px-4 py-3">
                      {t.provider ? (
                        <div>
                          <p className="text-xs text-gray-700 truncate max-w-[130px]">{t.provider.name}</p>
                          <p className="text-[10px] text-gray-400">{t.provider.type}</p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-300">—</span>
                      )}
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full", TYPE_CFG[t.type])}>
                        {t.type}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-right">
                      <p className="text-xs text-gray-900 tabular-nums">AED {t.amount.toFixed(2)}</p>
                      {t.totalRefunded > 0 && (
                        <p className="text-[10px] text-violet-500 tabular-nums">−{t.totalRefunded.toFixed(2)} refunded</p>
                      )}
                    </td>

                    {/* Method */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <MethodIcon method={t.method} />
                        <div>
                          <p className="text-xs text-gray-700">{t.method}</p>
                          {t.cardLast4 && <p className="text-[10px] text-gray-400">•••• {t.cardLast4}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", statusCfg.cls)}>
                        {statusCfg.label}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-right text-[11px] text-gray-400 whitespace-nowrap">
                      {format(new Date(t.createdAt), "MMM d, HH:mm")}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onViewDetails(t)}
                        className="p-1.5 text-gray-400 hover:text-[#003B95] hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
        <p className="text-xs text-gray-400">
          {processed.length === 0
            ? "No results"
            : `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, processed.length)} of ${processed.length}`}
        </p>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = i + 1;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "h-7 min-w-[28px] rounded-md text-xs transition-colors",
                  page === p
                    ? "bg-[#003B95] text-white"
                    : "text-gray-500 hover:bg-gray-100",
                )}
              >
                {p}
              </button>
            );
          })}
          {totalPages > 7 && <span className="text-xs text-gray-400">…</span>}
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="h-7 w-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
