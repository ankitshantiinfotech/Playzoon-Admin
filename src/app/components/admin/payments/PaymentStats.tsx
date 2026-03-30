// ─── US-102 Payment Stats Row ─────────────────────────────────────────────────
import { useMemo } from "react";
import { CreditCard, TrendingUp, RotateCcw, XCircle, CheckCircle } from "lucide-react";
import { PaymentTransaction } from "./types";

interface PaymentStatsProps { transactions: PaymentTransaction[]; }

export function PaymentStats({ transactions }: PaymentStatsProps) {
  const stats = useMemo(() => {
    const successTxns  = transactions.filter((t) => ["Success", "Refunded", "Refund Initiated"].includes(t.status));
    const failedTxns   = transactions.filter((t) => t.status === "Failed");
    const pendingTxns  = transactions.filter((t) => t.status === "Pending");
    const refundedTxns = transactions.filter((t) => ["Refunded", "Refund Initiated"].includes(t.status));

    return {
      total:          transactions.length,
      successVolume:  successTxns.reduce((a, t) => a + t.amount, 0),
      failedCount:    failedTxns.length,
      pendingCount:   pendingTxns.length,
      refundedCount:  refundedTxns.length,
      refundedVolume: transactions.reduce((a, t) => a + t.totalRefunded, 0),
      successRate:    transactions.length > 0
        ? Math.round((successTxns.length / transactions.length) * 100)
        : 0,
    };
  }, [transactions]);

  const cards = [
    {
      label: "Total Transactions",
      value: stats.total.toLocaleString(),
      sub: `${stats.successRate}% success rate`,
      icon: CreditCard,
      iconBg: "bg-blue-50",
      iconColor: "text-[#003B95]",
    },
    {
      label: "Successful Volume",
      value: `AED ${stats.successVolume.toLocaleString()}`,
      sub: `${transactions.length - stats.failedCount - stats.pendingCount} transactions`,
      icon: TrendingUp,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Refunded",
      value: `AED ${stats.refundedVolume.toLocaleString()}`,
      sub: `${stats.refundedCount} refund transactions`,
      icon: RotateCcw,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      label: "Failed / Pending",
      value: stats.failedCount.toString(),
      sub: `+${stats.pendingCount} pending`,
      icon: XCircle,
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-gray-400 uppercase tracking-wider truncate">{c.label}</p>
              <p className="text-xl text-gray-900 mt-1 tabular-nums truncate">{c.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{c.sub}</p>
            </div>
            <div className={`flex items-center justify-center h-9 w-9 rounded-xl shrink-0 ${c.iconBg}`}>
              <Icon className={`h-4 w-4 ${c.iconColor}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
