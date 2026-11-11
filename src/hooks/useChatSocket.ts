import { useEffect } from "react";
import { connectSocket, disconnectSocket } from "../services/socket";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import type { Message } from "../types";

type Payload = Record<string, unknown>;

function asMessage(value: unknown): Message | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Payload;
  const sender = item.sender && typeof item.sender === "object" ? item.sender as Payload : null;
  const id = String(item.id ?? item._id ?? "");
  const chatId = String(item.chatId ?? item.conversationId ?? "");
  const text = String(item.text ?? item.content ?? "");
  if (!chatId || !text) return null;
  return {
    id: id || `${chatId}-${String(item.createdAt ?? Date.now())}-${text}`,
    chatId,
    senderId: String(item.senderId ?? sender?.id ?? sender?._id ?? ""),
    text,
    createdAt: String(item.createdAt ?? item.timestamp ?? new Date().toISOString()),
    status: item.status === "seen" || item.status === "delivered" ? item.status : "sent",
  };
}

export function useChatSocket(): void {
  const user = useAuthStore((state) => state.user);
  const addMessage = useChatStore((state) => state.addMessage);
  const setTyping = useChatStore((state) => state.setTyping);
  const setUsers = useChatStore((state) => state.setUsers);

  useEffect(() => {
    if (!user) return;
    const socket = connectSocket();
    const onMessage = (payload: unknown) => {
      const message = asMessage(payload);
      if (message) addMessage(message);
    };
    const onTyping = (payload: unknown) => {
      if (!payload || typeof payload !== "object") return;
      const item = payload as Payload;
      if (!item.chatId || String(item.userId ?? "") === user.id) return;
      setTyping(String(item.chatId), item.isTyping === false ? null : String(item.name ?? "Someone"));
      if (item.isTyping !== false) {
        window.setTimeout(() => setTyping(String(item.chatId), null), 3000);
      }
    };
    const onOnline = (payload: unknown) => {
      if (!payload || typeof payload !== "object") return;
      const item = payload as Payload;
      const userId = String(item.userId ?? item.id ?? "");
      setUsers(useChatStore.getState().users.map((person) =>
        person.id === userId ? { ...person, status: item.online === false ? "offline" : "online" } : person,
      ));
    };
    const onMessageStatus = (payload: unknown) => {
      if (!payload || typeof payload !== "object") return;
      const item = payload as Payload;
      const chatId = String(item.chatId ?? "");
      const messageId = String(item.messageId ?? item.id ?? "");
      const status = item.status === "seen" ? "seen" : "delivered";
      if (!chatId || !messageId) return;
      const state = useChatStore.getState();
      state.setMessages(chatId, (state.messages[chatId] ?? []).map((message) =>
        message.id === messageId ? { ...message, status } : message,
      ));
    };

    socket.on("message:new", onMessage);
    socket.on("typing", onTyping);
    socket.on("user:online", onOnline);
    socket.on("message:delivered", onMessageStatus);
    socket.on("message:seen", onMessageStatus);
    return () => {
      socket.off("message:new", onMessage);
      socket.off("typing", onTyping);
      socket.off("user:online", onOnline);
      socket.off("message:delivered", onMessageStatus);
      socket.off("message:seen", onMessageStatus);
      disconnectSocket();
    };
  }, [addMessage, setTyping, setUsers, user]);
}
