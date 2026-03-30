import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  X, Send, Paperclip, Flag, Trash2, Ban, MoreVertical,
  FileText, Download, ImageIcon, AlertTriangle,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Conversation, ChatMessage, ChatUser } from "./types";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../../ui/alert-dialog";

interface MessageThreadProps {
  conversation: Conversation;
  adminId: string;
  onClose: () => void;
  onSendMessage: (convId: string, content: string) => void;
  onFlagMessage: (convId: string, msgId: string) => void;
  onDeleteMessage: (convId: string, msgId: string) => void;
  onBlockUser: (convId: string, userId: string) => void;
}

// ─── Avatar ──────────────────────────────────────────────────

function Avatar({ user, size = "sm" }: { user: ChatUser; size?: "sm" | "md" }) {
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-bold shrink-0 select-none",
        user.avatarColor,
        size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"
      )}
    >
      {user.initials}
    </div>
  );
}

// ─── Context Menu ────────────────────────────────────────────

function MessageContextMenu({
  msg,
  onFlag,
  onDelete,
}: {
  msg: ChatMessage;
  onFlag: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-all"
      >
        <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 w-40">
            {!msg.isFlagged && (
              <button
                onClick={() => { onFlag(); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-amber-50 hover:text-amber-700"
              >
                <Flag className="w-3.5 h-3.5" /> Flag Message
              </button>
            )}
            <button
              onClick={() => { onDelete(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Message
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Attachment Render ───────────────────────────────────────

function AttachmentPreview({ msg }: { msg: ChatMessage }) {
  if (!msg.attachment) return null;

  if (msg.attachment.type === "image") {
    return (
      <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 max-w-[240px]">
        <img
          src={msg.attachment.url}
          alt={msg.attachment.name}
          className="w-full h-auto object-cover max-h-[180px]"
        />
        <div className="px-2 py-1 bg-gray-50 flex items-center justify-between">
          <span className="text-[10px] text-gray-500 truncate">{msg.attachment.name}</span>
          <span className="text-[10px] text-gray-400">{msg.attachment.size}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 max-w-[240px]">
      <FileText className="w-5 h-5 text-blue-500 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-700 truncate">{msg.attachment.name}</p>
        <p className="text-[10px] text-gray-400">{msg.attachment.size}</p>
      </div>
      <button className="text-blue-500 hover:text-blue-700 shrink-0">
        <Download className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Message Bubble ──────────────────────────────────────────

function MessageBubble({
  msg,
  isAdmin,
  sender,
  showAvatar,
  onFlag,
  onDelete,
}: {
  msg: ChatMessage;
  isAdmin: boolean;
  sender: ChatUser | null;
  showAvatar: boolean;
  onFlag: () => void;
  onDelete: () => void;
}) {
  if (msg.type === "system") {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[11px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {msg.content}
        </span>
      </div>
    );
  }

  if (msg.isDeleted) {
    return (
      <div className={cn("flex w-full gap-2", isAdmin ? "justify-end" : "justify-start")}>
        {!isAdmin && <div className="w-8 shrink-0" />}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 italic bg-gray-50 rounded-lg px-3 py-2">
          <Trash2 className="w-3 h-3" />
          This message was deleted.
        </div>
        {isAdmin && <div className="w-8 shrink-0" />}
      </div>
    );
  }

  return (
    <div className={cn("flex w-full gap-2 group", isAdmin ? "justify-end" : "justify-start")}>
      {/* Left avatar */}
      {!isAdmin && (
        showAvatar && sender
          ? <Avatar user={sender} />
          : <div className="w-8 shrink-0" />
      )}

      <div className={cn("max-w-[70%] flex flex-col", isAdmin ? "items-end" : "items-start")}>
        {showAvatar && sender && (
          <span className="text-xs text-gray-500 mb-1 px-1">{sender.name}</span>
        )}

        <div className="flex items-start gap-1">
          {/* Context menu for non-admin messages (left side) */}
          {isAdmin && !msg.isDeleted && (
            <div className="mt-1 order-first">
              <MessageContextMenu msg={msg} onFlag={onFlag} onDelete={onDelete} />
            </div>
          )}

          {/* Bubble */}
          <div
            className={cn(
              "relative rounded-2xl text-sm shadow-sm px-4 py-2.5 transition-all",
              isAdmin ? "rounded-tr-none" : "rounded-tl-none",
              msg.isFlagged
                ? "bg-amber-50 border-2 border-amber-300"
                : isAdmin
                ? "bg-[#003B95] text-white"
                : "bg-white text-gray-900 border border-gray-100"
            )}
          >
            {/* Flag indicator */}
            {msg.isFlagged && (
              <div className="flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-100 rounded-lg px-2 py-1 mb-2 -mx-1">
                <Flag className="w-3 h-3 shrink-0" />
                <span><strong>Flagged:</strong> {msg.flagReason || "Inappropriate content"}</span>
              </div>
            )}

            <p className="leading-relaxed">{msg.content}</p>

            <AttachmentPreview msg={msg} />
          </div>

          {/* Context menu for incoming messages (right side) */}
          {!isAdmin && !msg.isDeleted && (
            <div className="mt-1">
              <MessageContextMenu msg={msg} onFlag={onFlag} onDelete={onDelete} />
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className={cn("text-[10px] text-gray-400 mt-1 px-1", isAdmin ? "text-right" : "text-left")}>
          {format(msg.timestamp, "h:mm a")}
        </span>
      </div>

      {/* Right avatar */}
      {isAdmin && (
        showAvatar && sender
          ? <Avatar user={sender} />
          : <div className="w-8 shrink-0" />
      )}
    </div>
  );
}

// ─── Main Thread Component ───────────────────────────────────

export function MessageThread({
  conversation,
  adminId,
  onClose,
  onSendMessage,
  onFlagMessage,
  onDeleteMessage,
  onBlockUser,
}: MessageThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [blockTarget, setBlockTarget] = useState<ChatUser | null>(null);

  const otherUser = conversation.participants.find((p) => p.id !== adminId) || conversation.participants[0];

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [conversation.messages]);

  const getSender = (senderId: string): ChatUser | null =>
    conversation.participants.find((p) => p.id === senderId) || null;

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;
    onSendMessage(conversation.id, text);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      onDeleteMessage(conversation.id, deleteTarget);
      setDeleteTarget(null);
      toast.success("Message deleted from conversation.");
    }
  };

  const confirmBlock = () => {
    if (blockTarget) {
      onBlockUser(conversation.id, blockTarget.id);
      setBlockTarget(null);
      toast.success(`${blockTarget.name} has been blocked from chat.`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar user={otherUser} size="md" />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 truncate max-w-[220px]">
              {otherUser.name}
            </h3>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px]",
                  otherUser.role === "Player"
                    ? "bg-blue-50 text-blue-700"
                    : otherUser.role === "Admin"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-violet-50 text-violet-700"
                )}
              >
                {otherUser.role}
              </span>
              {otherUser.isBlocked && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-50 text-red-600 flex items-center gap-0.5">
                  <Ban className="w-2.5 h-2.5" /> Blocked
                </span>
              )}
              {conversation.isSupport && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-50 text-orange-600">
                  Support Request
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!otherUser.isBlocked && otherUser.role !== "Admin" && (
            <button
              onClick={() => setBlockTarget(otherUser)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 transition-colors"
            >
              <Ban className="w-3.5 h-3.5" /> Block User
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/40 min-h-0">
        {/* Conversation start marker */}
        <div className="flex justify-center my-2">
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            Conversation started {format(conversation.createdAt, "MMM d, yyyy")}
          </span>
        </div>

        {conversation.messages.map((message, idx) => {
          const prev = idx > 0 ? conversation.messages[idx - 1] : null;
          const sender = getSender(message.senderId);
          const isAdmin = message.senderId === adminId;
          const showAvatar = !prev || prev.senderId !== message.senderId || message.type === "system";

          return (
            <MessageBubble
              key={message.id}
              msg={message}
              isAdmin={isAdmin}
              sender={sender}
              showAvatar={showAvatar}
              onFlag={() => onFlagMessage(conversation.id, message.id)}
              onDelete={() => setDeleteTarget(message.id)}
            />
          );
        })}
      </div>

      {/* ── Message Input ── */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white shrink-0">
        {otherUser.isBlocked ? (
          <div className="flex items-center gap-2 justify-center text-xs text-red-500 py-2">
            <Ban className="w-3.5 h-3.5" />
            <span>This user is blocked. You cannot send messages.</span>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <button
              className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => toast.info("File attachment feature — coming soon with backend integration.")}
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                rows={1}
                className="w-full resize-none border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-[100px]"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className={cn(
                "shrink-0 p-2.5 rounded-xl transition-colors",
                inputValue.trim()
                  ? "bg-[#003B95] text-white hover:bg-[#002d75]"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="z-[60]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" /> Delete this message?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This message will be permanently removed from the conversation thread. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              <Trash2 className="w-4 h-4 mr-1.5" /> Delete Message
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Block User Confirmation Dialog ── */}
      <AlertDialog open={!!blockTarget} onOpenChange={() => setBlockTarget(null)}>
        <AlertDialogContent className="z-[60]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-600" /> Block this user from chat?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  Blocking <strong>{blockTarget?.name}</strong> will prevent them from sending
                  any further messages in chat. Existing messages will be preserved.
                </p>
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-800">
                  <p className="font-semibold mb-1">This action:</p>
                  <ul className="space-y-1 pl-3 list-disc">
                    <li>Prevents the user from sending new messages</li>
                    <li>Keeps all existing conversation history</li>
                    <li>Can be reversed from User Management</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBlock} className="bg-red-600 hover:bg-red-700">
              <Ban className="w-4 h-4 mr-1.5" /> Block User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
