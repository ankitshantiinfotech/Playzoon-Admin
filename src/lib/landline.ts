/**
 * Optional landline: when provided, must contain 6–15 digits (non-digits ignored for count).
 */
export function isLandlineInvalid(landline: string | undefined | null): boolean {
  const raw = (landline ?? "").trim();
  if (!raw) return false;
  if (/[a-zA-Z]/.test(raw)) return true;
  const digits = raw.replace(/\D/g, "");
  return digits.length < 6 || digits.length > 15;
}
