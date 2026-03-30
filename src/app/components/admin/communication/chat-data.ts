// ─── Mock Chat Data for Provider Conversations ──────────────

export interface ChatMessage {
  id: string;
  senderId: "admin" | string; // "admin" or provider ID
  senderName: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export interface ProviderChatInfo {
  providerId: string;
  providerName: string;
  providerAvatar: string;
  providerType: string;
  messages: ChatMessage[];
  unreadCount: number;
}

// ─── Date helpers ────────────────────────────────────────────

const now = new Date(2026, 1, 20, 14, 30, 0);

function ago(minutes: number): Date {
  return new Date(now.getTime() - minutes * 60000);
}

// ─── Mock conversations ─────────────────────────────────────

export const MOCK_PROVIDER_CHATS: Record<string, ProviderChatInfo> = {
  "FP-001": {
    providerId: "FP-001",
    providerName: "Al Hamra Sports Complex",
    providerAvatar: "https://i.pravatar.cc/150?u=fp001",
    providerType: "Facility Provider",
    unreadCount: 3,
    messages: [
      { id: "m1", senderId: "admin", senderName: "Admin", content: "Hello Al Hamra, we noticed your facility listing needs an updated cover photo. Could you upload a new one?", timestamp: ago(120), isRead: true },
      { id: "m2", senderId: "FP-001", senderName: "Al Hamra Sports Complex", content: "Hi Admin, sure! We recently renovated. I'll upload new photos today.", timestamp: ago(90), isRead: true },
      { id: "m3", senderId: "admin", senderName: "Admin", content: "Great, thank you! Also, your operating hours seem to be outdated on the platform.", timestamp: ago(85), isRead: true },
      { id: "m4", senderId: "FP-001", senderName: "Al Hamra Sports Complex", content: "Oh yes, we extended our weekend hours. Let me update that as well.", timestamp: ago(60), isRead: true },
      { id: "m5", senderId: "FP-001", senderName: "Al Hamra Sports Complex", content: "I've uploaded the new photos. Can you verify they look correct?", timestamp: ago(15), isRead: false },
      { id: "m6", senderId: "FP-001", senderName: "Al Hamra Sports Complex", content: "Also, we have a new padel court opening next week. Should I list it separately?", timestamp: ago(10), isRead: false },
      { id: "m7", senderId: "FP-001", senderName: "Al Hamra Sports Complex", content: "Please let me know when you get a chance. Thank you!", timestamp: ago(5), isRead: false },
    ],
  },
  "FP-002": {
    providerId: "FP-002",
    providerName: "Dubai Arena & Recreation Center",
    providerAvatar: "https://i.pravatar.cc/150?u=fp002",
    providerType: "Facility Provider",
    unreadCount: 0,
    messages: [
      { id: "m1", senderId: "FP-002", senderName: "Dubai Arena & Recreation Center", content: "Hi, we have a question about the booking commission rates.", timestamp: ago(1440), isRead: true },
      { id: "m2", senderId: "admin", senderName: "Admin", content: "Of course! The standard commission rate is 15% per booking. For premium listings, it's 12%.", timestamp: ago(1420), isRead: true },
      { id: "m3", senderId: "FP-002", senderName: "Dubai Arena & Recreation Center", content: "Thank you for clarifying. We'd like to explore the premium option.", timestamp: ago(1410), isRead: true },
      { id: "m4", senderId: "admin", senderName: "Admin", content: "I'll have our partnerships team reach out to you with the details. Expect an email within 24 hours.", timestamp: ago(1400), isRead: true },
    ],
  },
  "TP-001": {
    providerId: "TP-001",
    providerName: "ProFit Training Academy",
    providerAvatar: "https://i.pravatar.cc/150?u=tp001",
    providerType: "Training Provider",
    unreadCount: 1,
    messages: [
      { id: "m1", senderId: "admin", senderName: "Admin", content: "Welcome to Playzoon! Your training academy has been approved.", timestamp: ago(4320), isRead: true },
      { id: "m2", senderId: "TP-001", senderName: "ProFit Training Academy", content: "Thank you! We're excited to be on the platform.", timestamp: ago(4300), isRead: true },
      { id: "m3", senderId: "admin", senderName: "Admin", content: "We noticed you haven't listed any training sessions yet. Need any help?", timestamp: ago(300), isRead: true },
      { id: "m4", senderId: "TP-001", senderName: "ProFit Training Academy", content: "Yes, we're working on scheduling. We should have sessions listed by end of week.", timestamp: ago(280), isRead: true },
      { id: "m5", senderId: "TP-001", senderName: "ProFit Training Academy", content: "Quick question - can we offer group discount packages through the platform?", timestamp: ago(30), isRead: false },
    ],
  },
  "CO-001": {
    providerId: "CO-001",
    providerName: "Coach Ahmed Al Mansouri",
    providerAvatar: "https://i.pravatar.cc/150?u=co001",
    providerType: "Coach",
    unreadCount: 2,
    messages: [
      { id: "m1", senderId: "admin", senderName: "Admin", content: "Hi Coach Ahmed, we have a player inquiry about private football sessions. Are you available?", timestamp: ago(200), isRead: true },
      { id: "m2", senderId: "CO-001", senderName: "Coach Ahmed Al Mansouri", content: "Yes, I have openings on weekday evenings and Saturday mornings.", timestamp: ago(180), isRead: true },
      { id: "m3", senderId: "admin", senderName: "Admin", content: "Perfect. I'll connect the player with you. They're looking for twice a week.", timestamp: ago(170), isRead: true },
      { id: "m4", senderId: "CO-001", senderName: "Coach Ahmed Al Mansouri", content: "Sounds good! By the way, can I update my certifications on my profile?", timestamp: ago(45), isRead: false },
      { id: "m5", senderId: "CO-001", senderName: "Coach Ahmed Al Mansouri", content: "I just completed my AFC B License coaching course.", timestamp: ago(44), isRead: false },
    ],
  },
  "CO-002": {
    providerId: "CO-002",
    providerName: "Coach Sara Al Hashemi",
    providerAvatar: "https://i.pravatar.cc/150?u=co002",
    providerType: "Coach",
    unreadCount: 0,
    messages: [
      { id: "m1", senderId: "CO-002", senderName: "Coach Sara Al Hashemi", content: "Hi! I wanted to ask about the review system. How does it work?", timestamp: ago(7200), isRead: true },
      { id: "m2", senderId: "admin", senderName: "Admin", content: "Players can leave reviews after completing a session. Reviews include a star rating and written feedback.", timestamp: ago(7100), isRead: true },
      { id: "m3", senderId: "CO-002", senderName: "Coach Sara Al Hashemi", content: "Got it, thanks for the info!", timestamp: ago(7050), isRead: true },
    ],
  },
  "TP-004": {
    providerId: "TP-004",
    providerName: "Desert Warriors MMA",
    providerAvatar: "https://i.pravatar.cc/150?u=tp004",
    providerType: "Training Provider",
    unreadCount: 5,
    messages: [
      { id: "m1", senderId: "admin", senderName: "Admin", content: "Desert Warriors, we've received some feedback about your session availability.", timestamp: ago(500), isRead: true },
      { id: "m2", senderId: "TP-004", senderName: "Desert Warriors MMA", content: "What kind of feedback?", timestamp: ago(480), isRead: true },
      { id: "m3", senderId: "admin", senderName: "Admin", content: "Players are reporting that sessions are frequently marked as full. Could you add more time slots?", timestamp: ago(470), isRead: true },
      { id: "m4", senderId: "TP-004", senderName: "Desert Warriors MMA", content: "We're at capacity right now. Planning to hire more trainers next month.", timestamp: ago(460), isRead: true },
      { id: "m5", senderId: "TP-004", senderName: "Desert Warriors MMA", content: "We've just hired 2 new trainers! Can we update our trainer listing?", timestamp: ago(50), isRead: false },
      { id: "m6", senderId: "TP-004", senderName: "Desert Warriors MMA", content: "Also want to add new Muay Thai and Brazilian Jiu-Jitsu classes.", timestamp: ago(48), isRead: false },
      { id: "m7", senderId: "TP-004", senderName: "Desert Warriors MMA", content: "We need to update the facility photos too - we expanded the training area.", timestamp: ago(40), isRead: false },
      { id: "m8", senderId: "TP-004", senderName: "Desert Warriors MMA", content: "And one more thing - can we get featured in the homepage carousel?", timestamp: ago(35), isRead: false },
      { id: "m9", senderId: "TP-004", senderName: "Desert Warriors MMA", content: "Please advise on all of the above when possible. Thanks!", timestamp: ago(30), isRead: false },
    ],
  },
};

/** Get all unread counts across all providers */
export function getTotalUnreadCount(): number {
  return Object.values(MOCK_PROVIDER_CHATS).reduce((sum, c) => sum + c.unreadCount, 0);
}

/** Get or create a chat info stub for any provider */
export function getChatForProvider(providerId: string, providerName: string): ProviderChatInfo {
  if (MOCK_PROVIDER_CHATS[providerId]) {
    return MOCK_PROVIDER_CHATS[providerId];
  }
  // Create an empty conversation for providers without existing chats
  return {
    providerId,
    providerName,
    providerAvatar: `https://i.pravatar.cc/150?u=${providerId.toLowerCase()}`,
    providerType: "Provider",
    messages: [],
    unreadCount: 0,
  };
}
