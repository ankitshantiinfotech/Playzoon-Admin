import { useState, useMemo } from "react";
import { BankVerification, BVProviderType, BVStatus, BV_STATUS_STYLES, BV_PROVIDER_TYPE_STYLES } from "./types";
import { format } from "date-fns";
import {
  Search, Filter, Download, ChevronUp, ChevronDown,
  Eye, CheckCircle2, XCircle, RotateCcw,
} from "lucide-react";
import { cn } from "../../../lib/utils";

interface BankVerificationTableProps {
  records: BankVerification[];
  onView: (r: BankVerification) => void;
  onQuickApprove: (r: BankVerification) => void;
  onQuickReject: (r: BankVerification) => void;
}

type SortKey = "providerName" | "providerType" | "accountHolderName" | "bankName" | "status" | "submittedAt";
type SortDir = "asc" | "desc";

const PROVIDER_TYPES: BVProviderType[] = ["Training Provider", "Facility Provider", "Freelancer Coach"];
const STATUSES: BVStatus[] = ["Pending", "Approved", "Rejected"];

export function BankVerificationTable({ records, onView, onQuickApprove, onQuickReject }: BankVerificationTableProps) {
  const [search,       setSearch]       = useState("");
  const [typeFilter,   setTypeFilter]   = useState<BVProviderType | "All">("All");
  const [statusFilter, setStatusFilter] = useState<BVStatus | "All">("All");
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState("");
  const [page,         setPage]         = useState(1);
  const [sort,         setSort]         = useState<{ key: SortKey; dir: SortDir }>({ key: "submittedAt", dir: "desc" });
  const PER_PAGE = 20;

  const filtered = useMemo(() => records.filter((r) => {
    const q = search.toLowerCase();
    if (q && !r.providerName.toLowerCase().includes(q) && !r.accountHolderName.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q)) return false;
    if (typeFilter !== "All" && r.providerType !== typeFilter)   return false;
    if (statusFilter !== "All" && r.status !== statusFilter)     return false;
    if (dateFrom && r.submittedAt < new Date(dateFrom))          return false;
    if (dateTo) {
      const end = new Date(dateTo); end.setHours(23, 59, 59, 999);
      if (r.submittedAt > end) return false;
    }
    return true;
  }), [records, search, typeFilter, statusFilter, dateFrom, dateTo]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let av: any = (a as any)[sort.key], bv: any = (b as any)[sort.key];
    if (sort.key === "submittedAt") { av = a.submittedAt.getTime(); bv = b.submittedAt.getTime(); }
    if (av < bv) return sort.dir === "asc" ? -1 : 1;
    if (av > bv) return sort.dir === "asc" ? 1 : -1;
    return 0;
  }), [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const paged      = sorted.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const handleSort = (key: SortKey) => {
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
    setPage(1);
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sort.key !== col ? null : sort.dir === "asc"
      ? <ChevronUp className="w-3 h-3 inline ml-1 text-blue-600" />
      : <ChevronDown className="w-3 h-3 inline ml-1 text-blue-600" />;

  const handleExport = () => {
    const rows = [
      ["ID", "Provider Name", "Provider Type", "Account Holder", "Bank Name", "IBAN (masked)", "Status", "Submitted", "Reviewed By"],
      ...sorted.map((r) => [r.id, r.providerName, r.providerType, r.accountHolderName, r.bankName, r.ibanMasked, r.status,
        format(r.submittedAt, "dd MMM yyyy HH:mm"), r.reviewedBy ?? ""]),
    ];
    const csv  = rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = `bank-verifications-${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
  };

  const activeFilters = [search, typeFilter !== "All", statusFilter !== "All", dateFrom, dateTo].filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">

      {/* ── Toolbar ── */}
      <div className="p-4 border-b border-gray-100 space-y-3 bg-gray-50/50">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search provider name, account holder, or ID…"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap ml-auto">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />

          {/* Status */}
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
            className="text-sm border border-gray-300 rounded-lg py-1.5 pl-2.5 pr-7 bg-white focus:ring-blue-500 focus:outline-none focus:border-blue-500">
            <option value="All">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Provider Type */}
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value as any); setPage(1); }}
            className="text-sm border border-gray-300 rounded-lg py-1.5 pl-2.5 pr-7 bg-white focus:ring-blue-500 focus:outline-none focus:border-blue-500">
            <option value="All">All Provider Types</option>
            {PROVIDER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Date From */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">From</span>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="text-sm border border-gray-300 rounded-lg py-1.5 px-2 bg-white focus:ring-blue-500 focus:outline-none" />
          </div>

          {/* Date To */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">To</span>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="text-sm border border-gray-300 rounded-lg py-1.5 px-2 bg-white focus:ring-blue-500 focus:outline-none" />
          </div>

          {activeFilters > 0 && (
            <button onClick={() => { setSearch(""); setTypeFilter("All"); setStatusFilter("All"); setDateFrom(""); setDateTo(""); setPage(1); }}
              className="text-xs text-red-500 hover:underline flex items-center gap-1">
              Clear filters ({activeFilters})
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200 sticky top-0">
            <tr>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("providerName")}>
                Provider <SortIcon col="providerName" />
              </th>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 hidden md:table-cell" onClick={() => handleSort("accountHolderName")}>
                Account Holder <SortIcon col="accountHolderName" />
              </th>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 hidden lg:table-cell" onClick={() => handleSort("bankName")}>
                Bank <SortIcon col="bankName" />
              </th>
              <th className="px-4 py-3 hidden xl:table-cell">
                IBAN (masked)
              </th>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("submittedAt")}>
                Submitted <SortIcon col="submittedAt" />
              </th>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort("status")}>
                Status <SortIcon col="status" />
              </th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {paged.length > 0 ? paged.map((r) => {
              const ss = BV_STATUS_STYLES[r.status];
              const ts = BV_PROVIDER_TYPE_STYLES[r.providerType];
              const isPending = r.status === "Pending";

              return (
                <tr key={r.id} onClick={() => onView(r)}
                  className={cn("cursor-pointer transition-colors hover:bg-blue-50/30",
                    r.status === "Pending" && "bg-amber-50/20")}>

                  {/* Provider */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <img src={r.providerAvatar} alt={r.providerName}
                        className="w-7 h-7 rounded-full border border-gray-200 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate max-w-[140px]">{r.providerName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", ts.bg, ts.text, ts.border)}>
                            {ts.abbr}
                          </span>
                          {r.isResubmission && (
                            <span className="flex items-center gap-0.5 text-[10px] text-orange-600 bg-orange-50 border border-orange-100 px-1 py-0.5 rounded">
                              <RotateCcw className="w-2.5 h-2.5" /> Resubmission
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Account Holder */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-gray-700">{r.accountHolderName}</span>
                  </td>

                  {/* Bank */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <p className="text-sm text-gray-700">{r.bankName}</p>
                    <p className="text-xs text-gray-400">{r.bankCountry}</p>
                  </td>

                  {/* IBAN masked (BR-125-06) */}
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="font-mono text-xs text-gray-500 tracking-wide">{r.ibanMasked}</span>
                  </td>

                  {/* Submitted */}
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-700">{format(r.submittedAt, "dd MMM yyyy")}</p>
                    <p className="text-[10px] text-gray-400">{format(r.submittedAt, "HH:mm")}</p>
                  </td>

                  {/* Status — Pending=amber, Approved=green, Rejected=red */}
                  <td className="px-4 py-3 text-center">
                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", ss.bg, ss.text, ss.border)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", ss.dot)} />
                      {r.status}
                    </span>
                  </td>

                  {/* Quick Actions */}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 justify-center">
                      {/* View */}
                      <button onClick={() => onView(r)} title="View details"
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Quick Approve */}
                      {isPending && (
                        <button onClick={() => onQuickApprove(r)} title="Approve"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Quick Reject */}
                      {isPending && (
                        <button onClick={() => onQuickReject(r)} title="Reject"
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No records match your filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50 text-sm">
        <span className="text-gray-500 text-xs">
          {sorted.length === 0 ? "0" : `${(safePage - 1) * PER_PAGE + 1}–${Math.min(safePage * PER_PAGE, sorted.length)}`} of {sorted.length} records
        </span>
        <div className="flex gap-1">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}
            className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-xs disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-xs disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
        </div>
      </div>
    </div>
  );
}
