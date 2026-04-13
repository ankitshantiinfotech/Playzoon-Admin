/**
 * Client-side helpers for saved card entry (validation & formatting).
 * Same logic as Playzoon-Web-Front `src/lib/payment-card.ts`.
 */

export type InferredCardBrand = "visa" | "mastercard" | "amex" | "mada" | "unknown";

/** Align with backend profile.service.js addPaymentMethod brand detection */
export function inferBrandFromPan(digits: string): InferredCardBrand {
  const d = digits.replace(/\D/g, "");
  if (!d) return "unknown";
  if (d.startsWith("4")) return "visa";
  if (d.length >= 4) {
    const first4 = parseInt(d.slice(0, 4), 10);
    if (!Number.isNaN(first4) && first4 >= 2221 && first4 <= 2720) {
      return "mastercard";
    }
  }
  if (/^5[1-5]/.test(d)) return "mastercard";
  if (/^3[47]/.test(d)) return "amex";
  if (/^(5078|6304|6759|9792)/.test(d)) return "mada";
  return "unknown";
}

/** Luhn check for primary account number (13–19 digits). */
export function luhnCheck(panDigits: string): boolean {
  const digits = panDigits.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i]!, 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function getCvvMaxLength(brand: InferredCardBrand): number {
  return brand === "amex" ? 4 : 3;
}

/**
 * Format PAN with spaces; Amex uses 4-6-5, others 4×4 (up to 19 for some cards).
 */
export function formatCardNumberInput(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 19);
  if (d.startsWith("34") || d.startsWith("37")) {
    const a = d.slice(0, 15);
    const p1 = a.slice(0, 4);
    const p2 = a.slice(4, 10);
    const p3 = a.slice(10, 15);
    return [p1, p2, p3].filter(Boolean).join(" ");
  }
  return d.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

/** Last moment of expiry month (month 1–12, four-digit year). */
export function endOfExpiryMonth(month: number, year: number): Date {
  return new Date(year, month, 0, 23, 59, 59, 999);
}

export function isExpiryInPast(month: number, year: number): boolean {
  return endOfExpiryMonth(month, year) < new Date();
}
