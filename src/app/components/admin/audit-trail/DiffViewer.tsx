import { useMemo } from "react";
import { cn } from "../../../lib/utils";
import { Plus, Minus, PenLine, Equal } from "lucide-react";
import type { AuditAction } from "./audit-types";

// ─── Types ───────────────────────────────────────────────────

type DiffStatus = "added" | "removed" | "changed" | "unchanged";

interface DiffLine {
  key: string;
  oldVal: string | null;
  newVal: string | null;
  status: DiffStatus;
}

interface Props {
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  action: AuditAction;
}

// ─── Helpers ─────────────────────────────────────────────────

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "null";
  if (typeof val === "string") return `"${val}"`;
  if (typeof val === "object") return JSON.stringify(val, null, 2);
  return String(val);
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ─── Compute diff lines ─────────────────────────────────────

function computeDiff(
  oldObj: Record<string, unknown> | null,
  newObj: Record<string, unknown> | null
): DiffLine[] {
  const lines: DiffLine[] = [];
  const allKeys = new Set<string>();
  if (oldObj) Object.keys(oldObj).forEach((k) => allKeys.add(k));
  if (newObj) Object.keys(newObj).forEach((k) => allKeys.add(k));

  const sortedKeys = Array.from(allKeys).sort();

  for (const key of sortedKeys) {
    const inOld = oldObj !== null && key in oldObj;
    const inNew = newObj !== null && key in newObj;

    if (inOld && inNew) {
      const oldV = oldObj![key];
      const newV = newObj![key];
      if (deepEqual(oldV, newV)) {
        lines.push({ key, oldVal: formatValue(oldV), newVal: formatValue(newV), status: "unchanged" });
      } else {
        lines.push({ key, oldVal: formatValue(oldV), newVal: formatValue(newV), status: "changed" });
      }
    } else if (inOld && !inNew) {
      lines.push({ key, oldVal: formatValue(oldObj![key]), newVal: null, status: "removed" });
    } else if (!inOld && inNew) {
      lines.push({ key, oldVal: null, newVal: formatValue(newObj![key]), status: "added" });
    }
  }

  return lines;
}

// ─── Status styling ──────────────────────────────────────────

const statusConfig: Record<DiffStatus, { icon: React.ElementType; bg: string; text: string; label: string }> = {
  added:     { icon: Plus,    bg: "bg-emerald-50", text: "text-emerald-700", label: "Added" },
  removed:   { icon: Minus,   bg: "bg-red-50",     text: "text-red-600",     label: "Removed" },
  changed:   { icon: PenLine, bg: "bg-amber-50",   text: "text-amber-700",   label: "Changed" },
  unchanged: { icon: Equal,   bg: "bg-white",      text: "text-gray-400",    label: "Unchanged" },
};

// ─── Component ───────────────────────────────────────────────

export function DiffViewer({ oldValues, newValues, action }: Props) {
  const diffLines = useMemo(() => computeDiff(oldValues, newValues), [oldValues, newValues]);
  const changedCount = diffLines.filter((l) => l.status !== "unchanged").length;

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px]">
        <span className="text-[#9CA3AF]">
          {diffLines.length} fields &middot; {changedCount} changed
        </span>
        <div className="flex items-center gap-3 ml-auto">
          {(["added", "removed", "changed", "unchanged"] as DiffStatus[]).map((s) => {
            const cfg = statusConfig[s];
            return (
              <span key={s} className="flex items-center gap-1 text-[10px] text-[#9CA3AF]">
                <span className={cn("w-2.5 h-2.5 rounded-sm border", cfg.bg, s === "unchanged" ? "border-gray-200" : "")} />
                {cfg.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Diff Table */}
      <div className="border rounded-lg overflow-hidden text-xs font-mono">
        {/* Header */}
        <div className="grid grid-cols-[180px_1fr_1fr] bg-gray-50 border-b">
          <div className="px-3 py-2 text-[10px] text-[#6B7280] uppercase tracking-wider">Field</div>
          <div className="px-3 py-2 text-[10px] text-[#6B7280] uppercase tracking-wider border-l">
            {action === "INSERT" ? "—" : "Old Value"}
          </div>
          <div className="px-3 py-2 text-[10px] text-[#6B7280] uppercase tracking-wider border-l">
            {action === "DELETE" ? "—" : "New Value"}
          </div>
        </div>

        {/* Rows */}
        {diffLines.map((line) => {
          const cfg = statusConfig[line.status];
          const Icon = cfg.icon;

          return (
            <div
              key={line.key}
              className={cn(
                "grid grid-cols-[180px_1fr_1fr] border-b last:border-b-0",
                line.status !== "unchanged" ? cfg.bg : "bg-white"
              )}
            >
              {/* Key */}
              <div className="px-3 py-2 flex items-start gap-1.5 border-r bg-gray-50/50">
                <Icon className={cn("h-3 w-3 mt-0.5 shrink-0", cfg.text)} />
                <span className={cn("break-all", line.status !== "unchanged" ? "text-[#111827]" : "text-[#9CA3AF]")}>
                  {line.key}
                </span>
              </div>

              {/* Old Value */}
              <div className={cn(
                "px-3 py-2 border-r overflow-hidden",
                line.status === "removed" && "bg-red-50",
                line.status === "changed" && "bg-red-50/40",
              )}>
                {line.oldVal !== null ? (
                  <pre className={cn(
                    "whitespace-pre-wrap break-all leading-relaxed",
                    line.status === "removed" ? "text-red-600 line-through" :
                    line.status === "changed" ? "text-red-500" :
                    "text-[#9CA3AF]"
                  )}>
                    {line.oldVal}
                  </pre>
                ) : (
                  <span className="text-[#D1D5DB] italic">—</span>
                )}
              </div>

              {/* New Value */}
              <div className={cn(
                "px-3 py-2 overflow-hidden",
                line.status === "added" && "bg-emerald-50",
                line.status === "changed" && "bg-emerald-50/40",
              )}>
                {line.newVal !== null ? (
                  <pre className={cn(
                    "whitespace-pre-wrap break-all leading-relaxed",
                    line.status === "added" ? "text-emerald-700" :
                    line.status === "changed" ? "text-emerald-700" :
                    "text-[#9CA3AF]"
                  )}>
                    {line.newVal}
                  </pre>
                ) : (
                  <span className="text-[#D1D5DB] italic">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
