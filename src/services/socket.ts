import { io, type Socket } from "socket.io-client";
import { readToken } from "./authStorage";

let socket: Socket | null = null;
let disconnectTimer: ReturnType<typeof setTimeout> | null = null;

function socketUrl(): string {
  const configured = import.meta.env.VITE_SOCKET_URL as string | undefined;
  if (configured) return configured;
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  return new URL(apiUrl).origin;
}

export function connectSocket(): Socket {
  if (disconnectTimer) {
    clearTimeout(disconnectTimer);
    disconnectTimer = null;
  }
  if (!socket) {
    socket = io(socketUrl(), {
      autoConnect: false,
      withCredentials: true,
      auth: { token: readToken() },
      transports: ["websocket", "polling"],
    });
  }
  socket.auth = { token: readToken() };
  if (!socket.connected) socket.connect();
  return socket;
}

export function disconnectSocket(): void {
  if (!socket || disconnectTimer) return;
  disconnectTimer = setTimeout(() => {
    socket?.disconnect();
    socket = null;
    disconnectTimer = null;
  }, 0);
}
