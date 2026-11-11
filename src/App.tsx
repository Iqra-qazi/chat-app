import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { ChatPage } from "./pages/ChatPage";
import { ToastProvider } from "./hooks/useToast";
import { useAuthStore } from "./store/authStore";
import { useChatStore } from "./store/chatStore";
import { useThemeStore } from "./store/themeStore";

function AppRoutes() {
  const logout = useAuthStore((state) => state.logout);
  const clearChats = useChatStore((state) => state.clearChats);
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      clearChats();
    };
    window.addEventListener("gather:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("gather:unauthorized", handleUnauthorized);
  }, [clearChats, logout]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  );
}

export default function App() {
  return <ToastProvider><AppRoutes /></ToastProvider>;
}
