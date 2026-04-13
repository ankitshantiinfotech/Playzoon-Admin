/**
 * Player profile bio HTML helpers (aligned with Playzoon-Web-Front / backend Rule 58).
 */

const ALLOWED_TAG_RE = "b|i|u|p|ul|ol|li|br";

/** Max plain-text length (matches backend bioCharCount). */
export const BIO_MAX_PLAIN_CHARS = 2000;

export function bioPlainTextLength(html: string): number {
  if (!html) return 0;
  return html.replace(/<[^>]*>/g, "").length;
}

export function stripBioToBackendRules(html: string): string {
  if (!html) return "";
  const pattern = new RegExp(`<(?!\/?(${ALLOWED_TAG_RE})(\\s|>|\\/))([^>]+)>`, "gi");
  return html.replace(pattern, "");
}

function escapeHtmlText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function serializeBioNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtmlText((node as Text).textContent || "");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as Element;
  const tag = el.tagName.toUpperCase();
  const map: Record<string, string> = {
    STRONG: "b",
    B: "b",
    EM: "i",
    I: "i",
    U: "u",
    P: "p",
    DIV: "p",
    UL: "ul",
    OL: "ol",
    LI: "li",
    BR: "br",
  };
  const out = map[tag];
  const inner = Array.from(el.childNodes).map(serializeBioNode).join("");
  if (!out) return inner;
  if (out === "br") return "<br>";
  return `<${out}>${inner}</${out}>`;
}

export function sanitizePlayerBioHtml(raw: string): string {
  if (!raw?.trim()) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return stripBioToBackendRules(raw);
  }
  try {
    const wrapped = `<div id="__bio_sanitize_root__">${raw}</div>`;
    const doc = new DOMParser().parseFromString(wrapped, "text/html");
    const root = doc.getElementById("__bio_sanitize_root__");
    if (!root) return stripBioToBackendRules(raw);
    const serialized = Array.from(root.childNodes).map(serializeBioNode).join("");
    return stripBioToBackendRules(serialized);
  } catch {
    return stripBioToBackendRules(escapeHtmlText(raw));
  }
}

function looksLikeBioHtml(value: string): boolean {
  return /<[a-z][\s/>]/i.test(value.trim());
}

export function bioValueToEditorHtml(value: string): string {
  if (!value?.trim()) return "";
  const v = value;
  if (looksLikeBioHtml(v)) {
    return sanitizePlayerBioHtml(v);
  }
  return escapeHtmlText(v).replace(/\r\n|\n|\r/g, "<br>");
}
