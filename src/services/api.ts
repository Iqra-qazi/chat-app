import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { AuthResponse, Conversation, Message, User } from "../types";
import { clearAuthStorage, readToken } from "./authStorage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = readToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearAuthStorage();
      window.dispatchEvent(new Event("gather:unauthorized"));
    }
    return Promise.reject(error);
  },
);

type AnyRecord = Record<string, unknown>;

function record(value: unknown): AnyRecord {
  return value && typeof value === "object" ? (value as AnyRecord) : {};
}

function idOf(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  const item = record(value);
  return String(item.id ?? item._id ?? "");
}

function normalizeUser(value: unknown): User {
  const item = record(value);
  return {
    id: idOf(value),
    name: String(item.name ?? item.username ?? "Someone"),
    email: typeof item.email === "string" ? item.email : undefined,
    avatar: typeof item.avatar === "string" ? item.avatar : typeof item.profilePicture === "string" ? item.profilePicture : undefined,
    status: item.status === "online" || item.isOnline === true ? "online" : "offline",
    lastSeen: typeof item.lastSeen === "string" ? item.lastSeen : undefined,
  };
}

function normalizeMessage(value: unknown, fallbackChatId = ""): Message {
  const item = record(value);
  const senderId = idOf(item.sender ?? item.senderId);
  return {
    id: idOf(value) || crypto.randomUUID(),
    chatId: String(item.chatId ?? fallbackChatId),
    senderId,
    text: String(item.text ?? item.content ?? ""),
    createdAt: String(item.createdAt ?? item.timestamp ?? new Date().toISOString()),
    status: item.status === "seen" || item.status === "delivered" ? item.status : "sent",
  };
}

function normalizeConversation(value: unknown): Conversation {
  const item = record(value);
  const members = Array.isArray(item.participants) ? item.participants : Array.isArray(item.users) ? item.users : [];
  const last = item.lastMessage ? normalizeMessage(item.lastMessage, idOf(value)) : undefined;
  return {
    id: idOf(value),
    participants: members.map(normalizeUser),
    lastMessage: last,
    unreadCount: Number(item.unreadCount ?? item.unread ?? 0),
    updatedAt: String(item.updatedAt ?? item.lastMessageAt ?? last?.createdAt ?? new Date().toISOString()),
  };
}

function unwrapList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const data = record(value).data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(record(value).users)) return record(value).users as unknown[];
  if (Array.isArray(record(value).chats)) return record(value).chats as unknown[];
  if (Array.isArray(record(value).messages)) return record(value).messages as unknown[];
  return [];
}

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = record(error.response?.data);
    if (typeof data.message === "string") return data.message;
    if (error.code === "ECONNABORTED") return "The server took too long to respond. Please try again.";
    if (!error.response) return "Could not reach the server. Check your connection and API URL.";
    return `Request failed (${error.response.status}). Please try again.`;
  }
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post("/auth/login", { email, username: email, password });
    const payload = record(data);
    return { token: typeof payload.token === "string" ? payload.token : undefined, user: normalizeUser(payload.user) };
  },
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post("/auth/register", { name, username: name, email, password });
    const payload = record(data);
    return { token: typeof payload.token === "string" ? payload.token : undefined, user: normalizeUser(payload.user) };
  },
};

export const chatApi = {
  async getUsers(): Promise<User[]> {
    const { data } = await api.get("/users");
    return unwrapList(data).map(normalizeUser);
  },
  async getConversations(): Promise<Conversation[]> {
    const { data } = await api.get("/chats");
    return unwrapList(data).map(normalizeConversation);
  },
  async getMessages(chatId: string, before?: string): Promise<Message[]> {
    const { data } = await api.get(`/messages/${encodeURIComponent(chatId)}`, {
      params: before ? { before, limit: 30 } : { limit: 30 },
    });
    return unwrapList(data).map((message) => normalizeMessage(message, chatId));
  },
  async sendMessage(chatId: string, text: string): Promise<Message> {
    const { data } = await api.post("/messages", { chatId, text });
    const payload = record(data);
    return normalizeMessage(payload.message ?? data, chatId);
  },
  async createConversation(userId: string): Promise<Conversation> {
    const { data } = await api.post("/chats", { userId });
    return normalizeConversation(record(data).chat ?? data);
  },
  async updateProfile(update: { name: string }): Promise<User> {
    const { data } = await api.patch("/users/me", update);
    return normalizeUser(record(data).user ?? data);
  },
};

export default api;
