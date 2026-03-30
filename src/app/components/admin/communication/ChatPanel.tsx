import { useState, useRef, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { X, Send, AlertTriangle, MessageSquareOff } from "lucide-react";
import { cn } from "../../ui/utils";
import { Button } from "../../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { useChatContext } from "./ChatContext";

// ─── Initials helper ─────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || "")
    .join("");
}

// ═══════════════════════════════════════════════════════════════
// Chat Panel (slide-out from right)
// ═══════════════════════════════════════════════════════════════

export function ChatPanel() {
  const {
    isChatPanelOpen,
    activeChatProvider,
    closeChat,
    sendMessage,
    chatEnabled,
    offlineMessagesEnabled,
    isAdminOnline,
  } = useChatContext();

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Auto-scroll to bottom on new messages ──────────
  useEffect(() => {
    if (isChatPanelOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeChatProvider?.messages.length, isChatPanelOpen]);

  // ── Focus input when panel opens ───────────────────
  useEffect(() => {
    if (isChatPanelOpen) {
      setTimeout(() => inputRef.current?.focus(), 400);
    } else {
      setInputValue("");
    }
  }, [isChatPanelOpen]);

  // ── Handle send ────────────────────────────────────
  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue("");
    inputRef.current?.focus();
  }, [inputValue, sendMessage]);

  // ── Handle key press ───────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Click outside to close ─────────────────────────
  useEffect(() => {
    if (!isChatPanelOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closeChat();
      }
    };
    // Delay to prevent immediate close
    const t = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 100);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [isChatPanelOpen, closeChat]);

  // ── Escape key to close ────────────────────────────
  useEffect(() => {
    if (!isChatPanelOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeChat();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isChatPanelOpen, closeChat]);

  const messages = activeChatProvider?.messages || [];
  const providerName = activeChatProvider?.providerName || "Provider";
  const providerAvatar = activeChatProvider?.providerAvatar || "";
  const providerType = activeChatProvider?.providerType || "";

  // ── Provider-side offline check ────────────────────
  const showOfflineBanner = chatEnabled && !offlineMessagesEnabled && !isAdminOnline;

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 transition-opacity duration-300",
          isChatPanelOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label={`Chat with ${providerName}`}
        aria-modal="true"
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out",
          isChatPanelOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* ── Header ──────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b bg-white shrink-0">
          <Avatar className="h-9 w-9">
            <AvatarImage src={providerAvatar} alt={providerName} />
            <AvatarFallback className="bg-[#003B95]/10 text-[#003B95] text-xs">
              {getInitials(providerName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm text-[#111827] truncate">{providerName}</h3>
              {/* Online status dot */}
              <span
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  isAdminOnline ? "bg-emerald-500" : "bg-gray-300"
                )}
                title={isAdminOnline ? "Online" : "Offline"}
              />
            </div>
            <p className="text-[11px] text-[#9CA3AF] truncate">{providerType}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={closeChat}
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* ── Offline Banner (Provider-side simulation) ─── */}
        {showOfflineBanner && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-200">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700">
              Admin is currently offline. Messaging is unavailable.
            </p>
          </div>
        )}

        {/* ── Messages Area ───────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0 bg-gray-50/50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-12">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                <MessageSquareOff className="h-6 w-6 text-gray-300" />
              </div>
              <p className="text-sm text-[#6B7280]">No messages yet</p>
              <p className="text-xs text-[#9CA3AF]">
                Start a conversation with {providerName}
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => {
                const isAdmin = msg.senderId === "admin";
                const prevMsg = idx > 0 ? messages[idx - 1] : null;
                const showDateDivider =
                  !prevMsg ||
                  format(msg.timestamp, "yyyy-MM-dd") !== format(prevMsg.timestamp, "yyyy-MM-dd");

                return (
                  <div key={msg.id}>
                    {/* Date divider */}
                    {showDateDivider && (
                      <div className="flex items-center gap-3 my-3">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-[10px] text-[#9CA3AF] shrink-0">
                          {format(msg.timestamp, "MMM dd, yyyy")}
                        </span>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={cn(
                        "flex",
                        isAdmin ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-3.5 py-2 space-y-0.5",
                          isAdmin
                            ? "bg-[#003B95] text-white rounded-br-md"
                            : "bg-white text-[#111827] border border-gray-200 rounded-bl-md shadow-sm"
                        )}
                      >
                        {!isAdmin && (
                          <p className="text-[10px] text-[#9CA3AF]">
                            {msg.senderName}
                          </p>
                        )}
                        <p className="text-sm leading-relaxed break-words">
                          {msg.content}
                        </p>
                        <p
                          className={cn(
                            "text-[10px] text-right",
                            isAdmin ? "text-white/60" : "text-[#9CA3AF]"
                          )}
                        >
                          {format(msg.timestamp, "HH:mm")}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* ── Input Area ──────────────────────────────── */}
        <div className="border-t bg-white px-4 py-3 shrink-0">
          {showOfflineBanner ? (
            /* Disabled input overlay when offline messaging is unavailable */
            <div className="relative">
              <div className="absolute inset-0 bg-gray-100/80 rounded-lg z-10 flex items-center justify-center">
                <p className="text-xs text-gray-400">Messaging unavailable</p>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <input
                  disabled
                  className="flex-1 h-10 px-3 rounded-lg border bg-gray-50 text-sm"
                  placeholder="Type a message..."
                />
                <Button disabled size="icon" className="h-10 w-10">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 h-10 px-3.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#003B95] focus:ring-1 focus:ring-[#003B95]/30 transition-all"
                aria-label="Message input"
              />
              <Button
                size="icon"
                className="h-10 w-10 bg-[#003B95] hover:bg-[#002a6b] text-white shrink-0"
                onClick={handleSend}
                disabled={!inputValue.trim()}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}