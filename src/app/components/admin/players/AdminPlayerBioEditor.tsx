import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Type,
  AlertCircle,
} from "lucide-react";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import {
  BIO_MAX_PLAIN_CHARS,
  bioPlainTextLength,
  bioValueToEditorHtml,
  sanitizePlayerBioHtml,
} from "../../../../lib/bio-html";

function placeCaretAtEnd(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

export function AdminPlayerBioEditor({
  value,
  onChange,
  error,
  disabled,
  id = "admin-bio-editor",
}: {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  disabled?: boolean;
  id?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastGoodHtmlRef = useRef("");
  const savedRangeRef = useRef<Range | null>(null);
  const maxChars = BIO_MAX_PLAIN_CHARS;
  const charCount = bioPlainTextLength(value);
  const isNearLimit = charCount > 1900;
  const isAtLimit = charCount >= maxChars;

  useEffect(() => {
    const saveSelection = () => {
      const el = editorRef.current;
      if (!el) return;
      const sel = window.getSelection();
      if (!sel?.rangeCount || !sel.anchorNode) return;
      if (!el.contains(sel.anchorNode)) return;
      try {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      } catch {
        /* ignore */
      }
    };
    document.addEventListener("selectionchange", saveSelection);
    return () => document.removeEventListener("selectionchange", saveSelection);
  }, []);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const propSan = sanitizePlayerBioHtml(value || "");
    const editorSan = sanitizePlayerBioHtml(el.innerHTML);
    if (editorSan === propSan) {
      lastGoodHtmlRef.current = propSan;
      return;
    }
    savedRangeRef.current = null;
    const html = bioValueToEditorHtml(value || "");
    el.innerHTML = html;
    lastGoodHtmlRef.current = sanitizePlayerBioHtml(html);
  }, [value]);

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const rawHtml = el.innerHTML;
    const plainLen = bioPlainTextLength(rawHtml);
    if (plainLen <= maxChars) {
      const cleaned = sanitizePlayerBioHtml(rawHtml);
      lastGoodHtmlRef.current = cleaned;
      onChange(cleaned);
    } else {
      el.innerHTML =
        lastGoodHtmlRef.current || bioValueToEditorHtml(value || "");
      onChange(lastGoodHtmlRef.current);
    }
  }, [maxChars, onChange, value]);

  const runCommand = useCallback(
    (fn: () => void) => {
      const el = editorRef.current;
      if (!el || disabled) return;
      el.focus();

      const sel = window.getSelection();
      const saved = savedRangeRef.current;
      if (saved) {
        try {
          const root = saved.commonAncestorContainer;
          if (el.contains(root) || root === el) {
            sel?.removeAllRanges();
            sel?.addRange(saved);
          }
        } catch {
          /* stale range */
        }
      }

      if (!sel?.rangeCount || !sel.anchorNode || !el.contains(sel.anchorNode)) {
        placeCaretAtEnd(el);
      }

      fn();

      requestAnimationFrame(() => {
        handleInput();
        const s = window.getSelection();
        if (s?.rangeCount && s.anchorNode && el.contains(s.anchorNode)) {
          try {
            savedRangeRef.current = s.getRangeAt(0).cloneRange();
          } catch {
            /* ignore */
          }
        }
      });
    },
    [disabled, handleInput],
  );

  const toolbarItems = useMemo(
    () => [
      {
        key: "bold",
        icon: Bold,
        label: "Bold",
        run: () => document.execCommand("bold", false),
      },
      {
        key: "italic",
        icon: Italic,
        label: "Italic",
        run: () => document.execCommand("italic", false),
      },
      {
        key: "underline",
        icon: Underline,
        label: "Underline",
        run: () => document.execCommand("underline", false),
      },
      {
        key: "ul",
        icon: List,
        label: "Bullet list",
        run: () => document.execCommand("insertUnorderedList", false, undefined),
      },
      {
        key: "ol",
        icon: ListOrdered,
        label: "Numbered list",
        run: () => document.execCommand("insertOrderedList", false, undefined),
      },
      {
        key: "p",
        icon: Type,
        label: "Paragraph",
        run: () => document.execCommand("formatBlock", false, "p"),
      },
    ],
    [],
  );

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm text-neutral-700">
        Bio / Personality
      </Label>
      <div
        className={cn(
          "border rounded-md overflow-hidden transition-colors bg-white",
          error
            ? "border-red-500"
            : "border-input focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        )}
      >
        <div
          className="flex flex-wrap items-center gap-0.5 border-b border-input bg-neutral-50/90 px-1.5 py-1"
          role="toolbar"
          aria-label="Bio formatting"
        >
          {toolbarItems.map((item) => (
            <Button
              key={item.key}
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 shrink-0 p-0 text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900"
              title={item.label}
              aria-label={item.label}
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => runCommand(item.run)}
            >
              <item.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
        <div
          id={id}
          ref={editorRef}
          contentEditable={!disabled}
          role="textbox"
          aria-multiline="true"
          aria-label="Bio"
          aria-describedby={`${id}-counter`}
          className={cn(
            "min-h-[120px] p-3 text-sm outline-none bg-transparent text-neutral-800",
            disabled && "opacity-60 pointer-events-none",
            "[&_ul]:[list-style-type:disc] [&_ul]:[list-style-position:outside] [&_ul]:my-2 [&_ul]:ml-4 [&_ul]:[padding-inline-start:1.25rem]",
            "[&_ol]:[list-style-type:decimal] [&_ol]:[list-style-position:outside] [&_ol]:my-2 [&_ol]:ml-4 [&_ol]:[padding-inline-start:1.25rem]",
            "[&_li]:[display:list-item] [&_li]:my-0.5 [&_li]:[padding-inline-start:0.25rem]",
            "[&_p]:mb-2 [&_p:last-child]:mb-0",
            "[&_b]:font-semibold [&_strong]:font-semibold",
          )}
          onInput={handleInput}
          onBlur={handleInput}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, text);
            requestAnimationFrame(() => handleInput());
          }}
          suppressContentEditableWarning
        />
      </div>
      <div className="flex justify-end">
        <span
          id={`${id}-counter`}
          className={cn(
            "text-xs",
            isAtLimit
              ? "text-red-600"
              : isNearLimit
                ? "text-amber-600"
                : "text-neutral-400",
          )}
        >
          {charCount}/{maxChars}
          {isAtLimit && <span className="ml-1">Maximum length reached</span>}
        </span>
      </div>
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1" role="alert">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}
