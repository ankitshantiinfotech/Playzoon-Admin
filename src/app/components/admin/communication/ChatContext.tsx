import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  MOCK_PROVIDER_CHATS,
  getChatForProvider,
  type ChatMessage,
  type ProviderChatInfo,
} from "./chat-data";

// ─── Context Shape ───────────────────────────────────────────

interface ChatContextValue {
  // ── Settings ──────────────────────────────────
  chatEnabled: boolean;
  setChatEnabled: (v: boolean) => void;
  offlineMessagesEnabled: boolean;
  setOfflineMessagesEnabled: (v: boolean) => void;
  isAdminOnline: boolean;
  setIsAdminOnline: (v: boolean) => void;

  // ── Unread counts ─────────────────────────────
  unreadCounts: Record<string, number>;
  totalUnread: number;

  // ── Chat panel ────────────────────────────────
  activeChatProvider: ProviderChatInfo | null;
  openChat: (providerId: string, providerName: string) => void;
  closeChat: () => void;
  isChatPanelOpen: boolean;

  // ── Messages ──────────────────────────────────
  sendMessage: (content: string) => void;
  markAsRead: (providerId: string) => void;
  getMessages: (providerId: string) => ChatMessage[];
}

const ChatContext = createContext<ChatContextValue | null>(null);

// ─── Provider Component ──────────────────────────────────────

export function ChatProvider({ children }: { children: ReactNode }) {
  // ── Settings state ────────────────────────────
  const [chatEnabled, setChatEnabled] = useState(true);
  const [offlineMessagesEnabled, setOfflineMessagesEnabled] = useState(true);
  const [isAdminOnline, setIsAdminOnline] = useState(true);

  // ── Chat data state ───────────────────────────
  const [chatStore, setChatStore] = useState<Record<string, ProviderChatInfo>>(
    () => ({ ...MOCK_PROVIDER_CHATS })
  );
  const [activeChatProvider, setActiveChatProvider] = useState<ProviderChatInfo | null>(null);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);

  // ── Unread counts ─────────────────────────────
  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [id, chat] of Object.entries(chatStore)) {
      counts[id] = chat.unreadCount;
    }
    return counts;
  }, [chatStore]);

  const totalUnread = useMemo(
    () => Object.values(unreadCounts).reduce((s, c) => s + c, 0),
    [unreadCounts]
  );

  // ── Open chat panel ───────────────────────────
  const openChat = useCallback(
    (providerId: string, providerName: string) => {
      if (!chatEnabled) return;

      let chat = chatStore[providerId];
      if (!chat) {
        chat = getChatForProvider(providerId, providerName);
        setChatStore(prev => ({ ...prev, [providerId]: chat! }));
      }

      // Mark as read on open
      const updated: ProviderChatInfo = {
        ...chat,
        unreadCount: 0,
        messages: chat.messages.map(m => ({ ...m, isRead: true })),
      };
      setChatStore(prev => ({ ...prev, [providerId]: updated }));
      setActiveChatProvider(updated);
      setIsChatPanelOpen(true);
    },
    [chatEnabled, chatStore]
  );

  // ── Close chat panel ──────────────────────────
  const closeChat = useCallback(() => {
    setIsChatPanelOpen(false);
    // Slight delay so animation completes
    setTimeout(() => setActiveChatProvider(null), 350);
  }, []);

  // ── Send message ──────────────────────────────
  const sendMessage = useCallback(
    (content: string) => {
      if (!activeChatProvider || !content.trim()) return;

      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: "admin",
        senderName: "Admin",
        content: content.trim(),
        timestamp: new Date(),
        isRead: true,
      };

      const updatedChat: ProviderChatInfo = {
        ...activeChatProvider,
        messages: [...activeChatProvider.messages, newMsg],
      };

      setChatStore(prev => ({ ...prev, [activeChatProvider.providerId]: updatedChat }));
      setActiveChatProvider(updatedChat);

      // Simulate provider auto-reply after 2–4 seconds (only sometimes)
      if (Math.random() < 0.4) {
        const replyDelay = 2000 + Math.random() * 2000;
        const replies = [
          "Thank you for the update!",
          "Got it, I'll take care of that.",
          "Noted. Will get back to you shortly.",
          "Thanks for letting me know.",
          "Understood, I'll follow up on this.",
        ];
        setTimeout(() => {
          const reply: ChatMessage = {
            id: `msg-${Date.now()}-reply`,
            senderId: activeChatProvider.providerId,
            senderName: activeChatProvider.providerName,
            content: replies[Math.floor(Math.random() * replies.length)],
            timestamp: new Date(),
            isRead: true, // Marked as read since panel is open
          };

          setChatStore(prev => {
            const existing = prev[activeChatProvider.providerId];
            if (!existing) return prev;
            const updated = {
              ...existing,
              messages: [...existing.messages, reply],
            };
            return { ...prev, [activeChatProvider.providerId]: updated };
          });

          setActiveChatProvider(prev => {
            if (!prev || prev.providerId !== activeChatProvider.providerId) return prev;
            return {
              ...prev,
              messages: [...prev.messages, reply],
            };
          });
        }, replyDelay);
      }
    },
    [activeChatProvider]
  );

  // ── Mark as read ──────────────────────────────
  const markAsRead = useCallback((providerId: string) => {
    setChatStore(prev => {
      const chat = prev[providerId];
      if (!chat || chat.unreadCount === 0) return prev;
      return {
        ...prev,
        [providerId]: {
          ...chat,
          unreadCount: 0,
          messages: chat.messages.map(m => ({ ...m, isRead: true })),
        },
      };
    });
  }, []);

  // ── Get messages ──────────────────────────────
  const getMessages = useCallback(
    (providerId: string): ChatMessage[] => {
      return chatStore[providerId]?.messages || [];
    },
    [chatStore]
  );

  // ── Cascade: when chat is disabled, close panel ────
  const handleSetChatEnabled = useCallback(
    (v: boolean) => {
      setChatEnabled(v);
      if (!v) {
        closeChat();
        // Also disable offline messages
        setOfflineMessagesEnabled(false);
      }
    },
    [closeChat]
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      chatEnabled,
      setChatEnabled: handleSetChatEnabled,
      offlineMessagesEnabled,
      setOfflineMessagesEnabled,
      isAdminOnline,
      setIsAdminOnline,
      unreadCounts,
      totalUnread,
      activeChatProvider,
      openChat,
      closeChat,
      isChatPanelOpen,
      sendMessage,
      markAsRead,
      getMessages,
    }),
    [
      chatEnabled,
      handleSetChatEnabled,
      offlineMessagesEnabled,
      isAdminOnline,
      unreadCounts,
      totalUnread,
      activeChatProvider,
      openChat,
      closeChat,
      isChatPanelOpen,
      sendMessage,
      markAsRead,
      getMessages,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return ctx;
}
