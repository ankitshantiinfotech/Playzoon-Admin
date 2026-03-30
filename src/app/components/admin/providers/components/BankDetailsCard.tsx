// ─── US-5.3.1 — Read-Only Bank Details Card with Approval Badge ──
// Structured read-only card showing bank account details with masked
// account numbers and color-coded approval status badge.
// Reusable across all provider detail pages.

import {
  Landmark, User, Hash, Globe, GitBranch, ShieldCheck,
  CreditCard, Clock, AlertTriangle,
} from "lucide-react";
import { cn } from "../../../ui/utils";
import { Badge } from "../../../ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export type BankApprovalStatus = "Pending" | "Approved" | "Rejected";

export interface BankAccountDetails {
  /** Account holder's full name */
  accountHolderName: string;
  /** Name of the bank (e.g. "Emirates NBD") */
  bankName: string;
  /** Full account number — will be masked on display */
  accountNumber: string;
  /** IBAN code */
  iban: string;
  /** SWIFT / BIC code */
  swiftCode?: string;
  /** Branch name or code */
  branch: string;
  /** Approval status */
  approvalStatus: BankApprovalStatus;
}

interface BankDetailsCardProps {
  /** Bank account details to display */
  bankAccount: BankAccountDetails;
  /** Optional extra CSS class */
  className?: string;
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

/** Mask an account number: show only last 4 digits */
function maskAccountNumber(num: string): string {
  const cleaned = num.replace(/\s/g, "");
  if (cleaned.length <= 4) return cleaned;
  return "•••• " + cleaned.slice(-4);
}

/** Mask IBAN: show first 2 country code + last 4 */
function maskIban(iban: string): string {
  const cleaned = iban.replace(/\s/g, "");
  if (cleaned.length <= 6) return cleaned;
  const country = cleaned.slice(0, 2);
  const last4 = cleaned.slice(-4);
  const middleLen = Math.max(0, cleaned.length - 6);
  return `${country}${"•".repeat(middleLen)}${last4}`;
}

// ═══════════════════════════════════════════════════════════════
// Approval Status Badge
// ═══════════════════════════════════════════════════════════════

const STATUS_CONFIG: Record<BankApprovalStatus, {
  bg: string; text: string; border: string; dot: string; icon: React.ElementType;
}> = {
  Pending: {
    bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200",
    dot: "bg-amber-400", icon: Clock,
  },
  Approved: {
    bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200",
    dot: "bg-emerald-500", icon: ShieldCheck,
  },
  Rejected: {
    bg: "bg-red-50", text: "text-red-600", border: "border-red-200",
    dot: "bg-red-500", icon: AlertTriangle,
  },
};

export function BankApprovalBadge({ status }: { status: BankApprovalStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn("text-xs gap-1.5 border", cfg.bg, cfg.text, cfg.border)}>
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  );
}

// ═══════════════════════════════════════════════════════════════
// Detail field row (label + value)
// ═══════════════════════════════════════════════════════════════

function DetailRow({
  icon: Icon,
  label,
  value,
  mono,
  tooltip,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
  tooltip?: string;
}) {
  const content = (
    <div className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50/60 transition-colors group">
      <div className="flex items-center justify-center h-7 w-7 rounded-md bg-gray-100 shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-gray-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p className={cn(
          "text-sm text-[#111827] break-all",
          mono && "font-mono tracking-wide",
        )}>
          {value}
        </p>
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[200px]">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  }
  return content;
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export function BankDetailsCard({ bankAccount, className }: BankDetailsCardProps) {
  const {
    accountHolderName,
    bankName,
    accountNumber,
    iban,
    swiftCode,
    branch,
    approvalStatus,
  } = bankAccount;

  return (
    <div className={cn("bg-white border border-gray-200 rounded-xl overflow-hidden", className)}>
      {/* ── Card Header ──────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#003B95]/10">
            <CreditCard className="h-4 w-4 text-[#003B95]" />
          </div>
          <h3 className="text-sm text-[#111827]">Bank Account Details</h3>
        </div>
        <BankApprovalBadge status={approvalStatus} />
      </div>

      {/* ── Card Body ────────────────────────────────── */}
      <div className="p-4 space-y-0.5">
        <DetailRow
          icon={User}
          label="Account Holder Name"
          value={accountHolderName}
        />
        <DetailRow
          icon={Landmark}
          label="Bank Name"
          value={bankName}
        />
        <DetailRow
          icon={Hash}
          label="Account Number"
          value={maskAccountNumber(accountNumber)}
          mono
          tooltip="Account number is masked for security"
        />
        <DetailRow
          icon={Globe}
          label="IBAN"
          value={maskIban(iban)}
          mono
          tooltip="IBAN is partially masked for security"
        />
        {swiftCode && (
          <DetailRow
            icon={Globe}
            label="SWIFT / BIC Code"
            value={swiftCode}
            mono
          />
        )}
        <DetailRow
          icon={GitBranch}
          label="Branch"
          value={branch}
        />
      </div>

      {/* ── Security footer ──────────────────────────── */}
      <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50/30">
        <p className="text-[10px] text-gray-400 flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3" />
          Banking details are read-only and displayed with masked account numbers for security.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Mock Bank Data Generator (for any provider)
// ═══════════════════════════════════════════════════════════════

const BANK_NAMES = [
  "Emirates NBD", "Abu Dhabi Commercial Bank", "First Abu Dhabi Bank",
  "Dubai Islamic Bank", "Mashreq Bank", "RAK Bank", "Sharjah Islamic Bank",
  "Commercial Bank of Dubai", "National Bank of Fujairah", "Al Hilal Bank",
];

const BRANCHES = [
  "Dubai Main Branch", "Abu Dhabi Central", "Sharjah City Centre",
  "Dubai Marina Branch", "DIFC Branch", "Al Ain Mall Branch",
  "Jumeirah Branch", "Downtown Dubai", "Business Bay Branch",
  "RAK Head Office",
];

const SWIFT_CODES = [
  "EABORUAEXXX", "ADCBAEAA", "NBADAEAA", "DUIBAEAD", "BOMLAEAD",
  "NABORUAKXXX", "SIBLAEAA", "CBDUAEAD", "NBFUAEAS", "HILAAEAD",
];

/** Generate mock bank details for a provider ID */
export function generateMockBankDetails(
  providerId: string,
  providerName: string,
): BankAccountDetails {
  const hash = providerId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const bankIdx = hash % BANK_NAMES.length;
  const branchIdx = (hash + 3) % BRANCHES.length;
  const swiftIdx = hash % SWIFT_CODES.length;

  // Generate realistic-looking account number
  const acctNum = `${1000 + (hash % 9000)}${2000 + ((hash * 7) % 8000)}${3000 + ((hash * 13) % 7000)}`;

  // Generate IBAN (AE format: AE + 2 check digits + 3-digit bank code + 16-digit account)
  const ibanNum = `AE${10 + (hash % 90)}0${bankIdx + 10}${acctNum}${"0".repeat(Math.max(0, 16 - acctNum.length))}`;

  // Status varies by hash
  const statuses: BankApprovalStatus[] = ["Approved", "Pending", "Rejected"];
  const status = statuses[hash % 3];

  return {
    accountHolderName: providerName,
    bankName: BANK_NAMES[bankIdx],
    accountNumber: acctNum,
    iban: ibanNum.slice(0, 23), // Standard AE IBAN = 23 chars
    swiftCode: SWIFT_CODES[swiftIdx],
    branch: BRANCHES[branchIdx],
    approvalStatus: status,
  };
}
