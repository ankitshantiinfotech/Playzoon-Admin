import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  MessageCircle, ChevronRight, RefreshCw, AlertTriangle,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Conversation, ChatMessage } from "./types";
import { MOCK_CONVERSATIONS, ADMIN_USER } from "./mockData";
import { ConversationList } from "./ConversationList";
import { MessageThread } from "./MessageThread";
import { Skeleton } from "../../ui/skeleton";

// ─── Screen State ────────────────────────────────────────────

type ScreenState = "loading" | "error" | "ready";

// ─── Skeleton ────────────────────────────────────────────────

function ChatSkeleton() {
  return (
    <div className="flex flex-1 gap-4 min-h-0">
      {/* Left panel skeleton */}
      <div className="w-[340px] shrink-0 bg-white border border-gray-200 rounded-xl p-3 space-y-3">
        <Skeleton className="h-9 w-full rounded-lg" />
        <Skeleton className="h-8 w-full rounded-lg" />
        <div className="space-y-2 mt-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-2.5 py-2">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Right panel skeleton */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="space-y-3 mt-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
              <Skeleton className={cn("h-12 rounded-2xl", i % 2 === 0 ? "w-[60%]" : "w-[45%]")} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Error State ─────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center bg-white border border-gray-200 rounded-xl px-8 py-16">
      <AlertTriangle className="w-12 h-12 text-red-300 mb-4" />
      <p className="text-base font-semibold text-gray-700">Unable to load chat data.</p>
      <p className="text-sm text-gray-500 mt-1">Please try again.</p>
      <button
        onClick={onRetry}
        className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#003B95] text-white text-sm font-medium rounded-lg hover:bg-[#002d75] transition-colors"
      >
        <RefreshCw className="w-4 h-4" /> Retry
      </button>
    </div>
  );
}

// ─── Empty Messages State ────────────────────────────────────

function EmptyMessageState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center bg-white border border-gray-200 rounded-xl shadow-sm px-8 py-16">
      <MessageCircle className="w-12 h-12 text-gray-200 mb-4" />
      <p className="text-base font-semibold text-gray-500">Select a conversation to view messages.</p>
      <p className="text-sm text-gray-400 mt-1.5 max-w-xs">
        Click any conversation from the list to view the full message thread and respond.
      </p>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export function AdminChatPage() {
  const [screenState, setScreenState] = useState<ScreenState>("ready");
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  const selectedConv = useMemo(
    () => conversations.find((c) => c.id === selectedConvId) ?? null,
    [conversations, selectedConvId]
  );

  // ── Simulate loading (for demo) ────────────────────────────

  const handleRetry = useCallback(() => {
    setScreenState("loading");
    setTimeout(() => setScreenState("ready"), 1500);
  }, []);

  // ── Select conversation ────────────────────────────────────

  const handleSelectConversation = useCallback((conv: Conversation) => {
    setSelectedConvId(conv.id);
    // Clear unread count
    setConversations((prev) =>
      prev.map((c) => c.id === conv.id ? { ...c, unreadCount: 0 } : c)
    );
  }, []);

  // ── Send message ───────────────────────────────────────────

  const handleSendMessage = useCallback((convId: string, content: string) => {
    const newMsg: ChatMessage = {
      id: `MSG-${Date.now()}`,
      senderId: ADMIN_USER.id,
      senderName: ADMIN_USER.name,
      content,
      timestamp: new Date(),
      type: "text",
      isFlagged: false,
      isDeleted: false,
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id !== convId
          ? c
          : { ...c, messages: [...c.messages, newMsg], updatedAt: new Date() }
      )
    );
    toast.success("Message sent.");
  }, []);

  // ── Flag message ───────────────────────────────────────────

  const handleFlagMessage = useCallback((convId: string, msgId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id !== convId
          ? c
          : {
              ...c,
              messages: c.messages.map((m) =>
                m.id !== msgId ? m : { ...m, isFlagged: true, flagReason: "Flagged by admin for review" }
              ),
            }
      )
    );
    toast.success("Message flagged as inappropriate.");
  }, []);

  // ── Delete message ─────────────────────────────────────────

  const handleDeleteMessage = useCallback((convId: string, msgId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id !== convId
          ? c
          : {
              ...c,
              messages: c.messages.map((m) =>
                m.id !== msgId ? m : { ...m, isDeleted: true }
              ),
            }
      )
    );
  }, []);

  // ── Block user ─────────────────────────────────────────────

  const handleBlockUser = useCallback((convId: string, userId: string) => {
    setConversations((prev) =>
      prev.map((c) => ({
        ...c,
        participants: c.participants.map((p) =>
          p.id !== userId ? p : { ...p, isBlocked: true }
        ),
      }))
    );
  }, []);

  return (
    <div className="flex flex-col h-full p-6 lg:p-8 gap-5 bg-[#F9FAFB] min-h-screen">
      {/* Header */}
      <div className="shrink-0">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
          <span>Admin Portal</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-600 font-medium">Chat</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
          <MessageCircle className="w-6 h-6 text-[#003B95]" /> Chat Management
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor conversations, provide admin support, and moderate chat content.
        </p>
      </div>

      {/* Content */}
      {screenState === "loading" ? (
        <ChatSkeleton />
      ) : screenState === "error" ? (
        <ErrorState onRetry={handleRetry} />
      ) : (
        <div className="flex flex-1 gap-4 min-h-0 overflow-hidden">
          {/* Left: Conversation List */}
          <div className="w-[340px] shrink-0 min-h-0">
            <ConversationList
              conversations={conversations}
              selectedId={selectedConvId}
              onSelect={handleSelectConversation}
            />
          </div>

          {/* Right: Message Thread or Empty State */}
          {selectedConv ? (
            <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              <MessageThread
                conversation={selectedConv}
                adminId={ADMIN_USER.id}
                onClose={() => setSelectedConvId(null)}
                onSendMessage={handleSendMessage}
                onFlagMessage={handleFlagMessage}
                onDeleteMessage={handleDeleteMessage}
                onBlockUser={handleBlockUser}
              />
            </div>
          ) : (
            <EmptyMessageState />
          )}
        </div>
      )}
    </div>
  );
}
