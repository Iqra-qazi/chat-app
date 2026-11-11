import { useMemo, useState } from "react";
import { MessageCircle, Moon, Plus, Search, Settings2, Sun, Users, X } from "lucide-react";
import { Avatar } from "./Avatar";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import { useThemeStore } from "../store/themeStore";
import { formatTime } from "../utils/format";
import type { Conversation, User } from "../types";

interface SidebarProps {
  onProfile: () => void;
  onStartChat: (user: User) => void;
  onMobileClose?: () => void;
  onMobileSelect?: () => void;
}

function otherParticipant(chat: Conversation, currentUserId: string): User {
  return chat.participants.find((person) => person.id !== currentUserId) ?? chat.participants[0] ?? { id: chat.id, name: "Conversation" };
}

export function Sidebar({ onProfile, onStartChat, onMobileClose, onMobileSelect }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const { conversations, users, activeChatId, setActiveChat } = useChatStore();
  const { theme, toggleTheme } = useThemeStore();
  const [query, setQuery] = useState("");
  const [showPeople, setShowPeople] = useState(false);
  const currentUserId = user?.id ?? "";
  const matchingChats = useMemo(() => conversations.filter((chat) => {
    const person = otherParticipant(chat, currentUserId);
    return person.name.toLowerCase().includes(query.toLowerCase()) ||
      (chat.lastMessage?.text.toLowerCase().includes(query.toLowerCase()) ?? false);
  }), [conversations, currentUserId, query]);
  const matchingUsers = useMemo(() => users.filter((person) =>
    person.id !== currentUserId && person.name.toLowerCase().includes(query.toLowerCase()),
  ), [users, currentUserId, query]);

  const selectChat = (id: string) => {
    setActiveChat(id);
    onMobileSelect?.();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="brand-lockup">
          <span className="brand-mark"><MessageCircle size={19} fill="currentColor" /></span>
          <span className="brand-name">gather<span>.</span></span>
        </div>
        <button className="icon-button mobile-only" aria-label="Close conversations" onClick={onMobileClose}><X size={19} /></button>
      </div>

      <div className="inbox-heading">
        <div>
          <p className="eyebrow">YOUR SPACE</p>
          <h1>Messages <span>{conversations.length || ""}</span></h1>
        </div>
        <button className="new-chat-button" aria-label="Start a conversation" onClick={() => setShowPeople((value) => !value)}>
          <Plus size={19} />
        </button>
      </div>

      <label className="search-field">
        <Search size={17} />
        <input aria-label="Search conversations" placeholder="Search conversations" value={query} onChange={(event) => setQuery(event.target.value)} />
        {query && <button aria-label="Clear search" onClick={() => setQuery("")}><X size={14} /></button>}
      </label>

      {showPeople && (
        <div className="people-picker">
          <div className="picker-heading"><Users size={15} /> <span>Start a new chat</span></div>
          {matchingUsers.length ? matchingUsers.map((person) => (
            <button key={person.id} className="person-option" onClick={() => { onStartChat(person); setShowPeople(false); }}>
              <Avatar user={person} size="sm" showStatus />
              <span>{person.name}</span>
              <Plus size={15} />
            </button>
          )) : <p className="picker-empty">{users.length ? "No people found." : "No other people are available yet."}</p>}
        </div>
      )}

      <div className="conversation-list">
        {matchingChats.length ? matchingChats.map((chat) => {
          const person = otherParticipant(chat, currentUserId);
          const active = activeChatId === chat.id;
          return (
            <button key={chat.id} className={`conversation-item ${active ? "conversation-active" : ""}`} onClick={() => selectChat(chat.id)}>
              <Avatar user={person} size="md" showStatus />
              <span className="conversation-copy">
                <span className="conversation-line"><strong>{person.name}</strong><time>{formatTime(chat.lastMessage?.createdAt ?? chat.updatedAt)}</time></span>
                <span className="conversation-preview">
                  <span>{chat.lastMessage?.text || "Start a conversation"}</span>
                  {chat.unreadCount > 0 && <span className="unread-badge">{chat.unreadCount > 9 ? "9+" : chat.unreadCount}</span>}
                </span>
              </span>
            </button>
          );
        }) : (
          <div className="sidebar-empty">
            <span className="empty-icon"><MessageCircle size={21} /></span>
            <strong>{query ? "No matches" : "It’s quiet here"}</strong>
            <span>{query ? "Try another search." : "Start a conversation and say hello."}</span>
            {!query && <button onClick={() => setShowPeople(true)}>Find someone <span>↗</span></button>}
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <button className="profile-button" onClick={onProfile}>
          <Avatar user={user ?? { id: "me", name: "You" }} size="md" />
          <span className="profile-copy"><strong>{user?.name ?? "Your profile"}</strong><span>View profile</span></span>
          <Settings2 size={17} className="profile-settings" />
        </button>
        <div className="footer-actions">
          <button onClick={toggleTheme}><span className="theme-icon">{theme === "light" ? <Moon size={16} /> : <Sun size={16} />}</span>{theme === "light" ? "Dark mode" : "Light mode"}</button>
          <button onClick={logout}>Sign out</button>
        </div>
      </div>
    </aside>
  );
}
