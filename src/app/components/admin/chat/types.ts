// ─── Admin Chat Management — Types ────────────────────────────

export type ConversationType = "support" | "user-to-user" | "provider-to-admin";

export type MessageType = "text" | "image" | "file" | "system";

export interface ChatUser {
  id: string;
  name: string;
  initials: string;
  role: "Player" | "Provider" | "Freelancer Coach" | "Admin";
  avatarColor: string; // tailwind bg class
  email: string;
  isBlocked: boolean;
}

export interface ChatAttachment {
  id: string;
  type: "image" | "file";
  url: string;
  name: string;
  size: string; // e.g. "2.4 MB"
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: MessageType;
  isFlagged: boolean;
  flagReason?: string;
  isDeleted: boolean;
  attachment?: ChatAttachment;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  participants: ChatUser[];
  messages: ChatMessage[];
  unreadCount: number;
  isSupport: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Helpers ──────────────────────────────────────────────────

export const CONVERSATION_TYPE_LABELS: Record<ConversationType, string> = {
  "support": "Support Request",
  "user-to-user": "User-to-User",
  "provider-to-admin": "Provider-to-Admin",
};

export const CONVERSATION_TYPE_COLORS: Record<ConversationType, string> = {
  "support": "bg-orange-50 text-orange-700 border-orange-200",
  "user-to-user": "bg-blue-50 text-blue-700 border-blue-200",
  "provider-to-admin": "bg-violet-50 text-violet-700 border-violet-200",
};
