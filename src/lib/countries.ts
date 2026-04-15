/**
 * Normalizes GET /config/countries (same as web profile).
 * Handles api envelope unwrapping: { data: { countries } } or { countries }.
 */
export function normalizeCountriesFromConfig(
  body: unknown,
): { id: string; name_en: string }[] {
  const root = body as Record<string, unknown> | null | undefined;
  if (!root) return [];
  const inner = (root.data as Record<string, unknown>) ?? root;
  const list = inner.countries;
  if (!Array.isArray(list)) return [];
  return list
    .map((c: Record<string, unknown>) => ({
      id: String(c.id ?? ""),
      name_en: String(c.name_en ?? c.name ?? "").trim() || String(c.id ?? ""),
    }))
    .filter((c) => c.id);
}
