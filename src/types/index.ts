export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  status?: "online" | "offline";
  lastSeen?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
  status: "sent" | "delivered" | "seen";
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface AuthResponse {
  token?: string;
  user: User;
}

export interface ApiList<T> {
  data: T[];
  hasMore?: boolean;
}
