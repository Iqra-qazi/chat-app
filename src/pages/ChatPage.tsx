import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { LoaderCircle, Menu } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { ChatWindow } from "../components/ChatWindow";
import { ProfileModal } from "../components/ProfileModal";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import { useToast } from "../hooks/useToast";
import { useChatSocket } from "../hooks/useChatSocket";
import { chatApi, getApiError } from "../services/api";
import type { User } from "../types";

export function ChatPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { conversations, activeChatId, setConversations, setUsers, setActiveChat, clearChats } = useChatStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);
  useChatSocket();

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    Promise.allSettled([chatApi.getConversations(), chatApi.getUsers()]).then((results) => {
      if (cancelled) return;
      const [chats, people] = results;
      if (chats.status === "fulfilled") setConversations(chats.value);
      else toast(`Could not load conversations: ${getApiError(chats.reason)}`, "error");
      if (people.status === "fulfilled") setUsers(people.value);
      else toast(`Could not load people: ${getApiError(people.reason)}`, "error");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated, setConversations, setUsers, toast]);

  useEffect(() => {
    if (!activeChatId) setMobileChatOpen(false);
  }, [activeChatId]);

  useEffect(() => () => clearChats(), [clearChats]);

  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  const startChat = async (person: User) => {
    try {
      const conversation = await chatApi.createConversation(person.id);
      setConversations([conversation, ...useChatStore.getState().conversations.filter((chat) => chat.id !== conversation.id)]);
      setActiveChat(conversation.id);
      setMobileChatOpen(true);
    } catch (error) {
      toast(getApiError(error), "error");
    }
  };

  return (
    <main className={`app-shell ${mobileChatOpen ? "mobile-chat-open" : ""}`}>
      {loading && conversations.length === 0 && (
        <div className="loading-overlay"><LoaderCircle className="spin" size={27} /><span>Getting your space ready...</span></div>
      )}
      <Sidebar
        onProfile={() => user && setProfile(user)}
        onStartChat={(person) => void startChat(person)}
        onMobileClose={() => setMobileChatOpen(false)}
        onMobileSelect={() => setMobileChatOpen(true)}
      />
      <ChatWindow onBack={() => setMobileChatOpen(false)} onProfile={setProfile} />
      {!activeChatId && <button className="mobile-menu-button mobile-only" aria-label="Open conversations" onClick={() => setMobileChatOpen(false)}><Menu size={19} /></button>}
      {profile && <ProfileModal person={profile} editable={profile.id === user?.id} onClose={() => setProfile(null)} />}
    </main>
  );
}
