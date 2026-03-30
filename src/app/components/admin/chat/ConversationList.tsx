import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { Search, MessageCircle, Circle } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Conversation, ConversationType, CONVERSATION_TYPE_LABELS } from "./types";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conv: Conversation) => void;
}

const TYPE_OPTIONS: { value: ConversationType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "support", label: "Support Requests" },
  { value: "user-to-user", label: "User-to-User" },
  { value: "provider-to-admin", label: "Provider-to-Admin" },
];

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ConversationType | "all">("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return conversations
      .filter((c) => {
        // Search
        if (q) {
          const nameMatch = c.participants.some((p) => p.name.toLowerCase().includes(q));
          const msgMatch = c.messages.some((m) => m.content.toLowerCase().includes(q));
          if (!nameMatch && !msgMatch) return false;
        }
        // Type filter
        if (typeFilter !== "all" && c.type !== typeFilter) return false;
        return true;
      })
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [conversations, search, typeFilter]);

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Search & Filter */}
      <div className="px-3 py-3 border-b border-gray-200 bg-gray-50/60 space-y-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or message…"
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="w-full text-xs border border-gray-300 rounded-lg py-1.5 pl-2.5 pr-6 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Conversation items */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <MessageCircle className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-500">No conversations found.</p>
          </div>
        ) : (
          filtered.map((conv) => {
            const otherParticipant = conv.participants.find((p) => p.role !== "Admin") || conv.participants[0];
            const lastMsg = conv.messages.filter((m) => m.type !== "system").at(-1);
            const isSelected = selectedId === conv.id;

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={cn(
                  "w-full text-left px-3 py-3 hover:bg-blue-50/40 transition-colors flex items-start gap-2.5",
                  isSelected && "bg-blue-50 border-l-3 border-l-[#003B95]"
                )}
              >
                {/* Avatar */}
                <div className="relative shrink-0 mt-0.5">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold",
                      otherParticipant.avatarColor
                    )}
                  >
                    {otherParticipant.initials}
                  </div>
                  {/* Support request indicator */}
                  {conv.isSupport && (
                    <Circle className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      "text-sm truncate max-w-[160px]",
                      conv.unreadCount > 0 ? "font-bold text-gray-900" : "font-medium text-gray-800"
                    )}>
                      {otherParticipant.name}
                    </p>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {formatDistanceToNow(conv.updatedAt, { addSuffix: false })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className={cn(
                      "text-xs truncate max-w-[180px]",
                      conv.unreadCount > 0 ? "text-gray-700 font-medium" : "text-gray-500"
                    )}>
                      {lastMsg ? lastMsg.content : "No messages yet"}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 font-bold text-white bg-[#003B95] shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Type badge */}
                  <span className={cn(
                    "inline-block text-[10px] px-1.5 py-0.5 rounded mt-1",
                    conv.type === "support"
                      ? "bg-orange-50 text-orange-600"
                      : conv.type === "provider-to-admin"
                      ? "bg-violet-50 text-violet-600"
                      : "bg-gray-100 text-gray-500"
                  )}>
                    {CONVERSATION_TYPE_LABELS[conv.type]}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
