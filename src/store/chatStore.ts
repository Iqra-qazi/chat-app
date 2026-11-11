import { create } from "zustand";
import type { Conversation, Message, User } from "../types";

interface ChatState {
  conversations: Conversation[];
  users: User[];
  messages: Record<string, Message[]>;
  activeChatId: string | null;
  typingUsers: Record<string, string>;
  setConversations: (conversations: Conversation[]) => void;
  setUsers: (users: User[]) => void;
  setActiveChat: (chatId: string | null) => void;
  setMessages: (chatId: string, messages: Message[], prepend?: boolean) => void;
  addMessage: (message: Message) => void;
  setTyping: (chatId: string, name: string | null) => void;
  markSeen: (chatId: string) => void;
  clearChats: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  users: [],
  messages: {},
  activeChatId: null,
  typingUsers: {},
  setConversations: (conversations) => set({ conversations }),
  setUsers: (users) => set({ users }),
  setActiveChat: (activeChatId) => set({ activeChatId }),
  setMessages: (chatId, messages, prepend = false) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: prepend
          ? [...messages, ...(state.messages[chatId] ?? [])]
          : messages,
      },
    })),
  addMessage: (message) =>
    set((state) => {
      const current = state.messages[message.chatId] ?? [];
      if (current.some((item) => item.id === message.id)) return state;
      const conversations = state.conversations.map((chat) =>
        chat.id === message.chatId
          ? { ...chat, lastMessage: message, updatedAt: message.createdAt, unreadCount: chat.id === state.activeChatId ? 0 : chat.unreadCount + 1 }
          : chat,
      );
      return {
        messages: { ...state.messages, [message.chatId]: [...current, message] },
        conversations,
      };
    }),
  setTyping: (chatId, name) =>
    set((state) => {
      const typingUsers = { ...state.typingUsers };
      if (name) typingUsers[chatId] = name;
      else delete typingUsers[chatId];
      return { typingUsers };
    }),
  markSeen: (chatId) =>
    set((state) => ({
      conversations: state.conversations.map((chat) => chat.id === chatId ? { ...chat, unreadCount: 0 } : chat),
    })),
  clearChats: () => set({ conversations: [], users: [], messages: {}, activeChatId: null, typingUsers: {} }),
}));
