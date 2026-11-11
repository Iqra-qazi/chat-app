import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, Check, LoaderCircle, MoreHorizontal, Paperclip, Send, Smile, Sparkles } from "lucide-react";
import { Avatar } from "./Avatar";
import { MessageBubble } from "./MessageBubble";
import { chatApi, getApiError } from "../services/api";
import { connectSocket } from "../services/socket";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import { useToast } from "../hooks/useToast";
import { formatTime } from "../utils/format";
import type { User } from "../types";

interface ChatWindowProps {
  onBack: () => void;
  onProfile: (person: User) => void;
}

export function ChatWindow({ onBack, onProfile }: ChatWindowProps) {
  const { user } = useAuthStore();
  const { conversations, activeChatId, messages, setMessages, addMessage, typingUsers, markSeen } = useChatStore();
  const { toast } = useToast();
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sending, setSending] = useState(false);
  const [showScroll, setShowScroll] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<number | undefined>(undefined);
  const chat = conversations.find((item) => item.id === activeChatId);
  const person = useMemo(() => chat?.participants.find((item) => item.id !== user?.id) ?? chat?.participants[0], [chat, user?.id]);
  const chatMessages = activeChatId ? messages[activeChatId] ?? [] : [];

  useEffect(() => {
    if (!activeChatId) return;
    let cancelled = false;
    setLoading(true);
    setHasMore(true);
    chatApi.getMessages(activeChatId)
      .then((result) => {
        if (cancelled) return;
        setMessages(activeChatId, result);
        setHasMore(result.length >= 30);
        markSeen(activeChatId);
        connectSocket().emit("message:seen", { chatId: activeChatId });
      })
      .catch((error: unknown) => {
        if (!cancelled) toast(getApiError(error), "error");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeChatId, markSeen, setMessages, toast]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages.length, activeChatId]);

  const loadOlder = useCallback(async () => {
    if (!activeChatId || loadingOlder || !hasMore || chatMessages.length === 0) return;
    const list = listRef.current;
    const oldHeight = list?.scrollHeight ?? 0;
    setLoadingOlder(true);
    try {
      const older = await chatApi.getMessages(activeChatId, chatMessages[0].createdAt);
      setMessages(activeChatId, older, true);
      setHasMore(older.length >= 30);
      requestAnimationFrame(() => {
        if (list) list.scrollTop = list.scrollHeight - oldHeight;
      });
    } catch (error) {
      toast(getApiError(error), "error");
    } finally {
      setLoadingOlder(false);
    }
  }, [activeChatId, chatMessages, hasMore, loadingOlder, setMessages, toast]);

  const notifyTyping = (value: string) => {
    setDraft(value);
    if (!activeChatId || !user) return;
    const socket = connectSocket();
    socket.emit("typing", { chatId: activeChatId, userId: user.id, name: user.name, isTyping: true });
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => {
      socket.emit("typing", { chatId: activeChatId, userId: user.id, isTyping: false });
    }, 1000);
  };

  const send = async () => {
    const text = draft.trim();
    if (!activeChatId || !text || sending) return;
    setSending(true);
    setDraft("");
    try {
      const message = await chatApi.sendMessage(activeChatId, text);
      addMessage(message);
      connectSocket().emit("message:seen", { chatId: activeChatId });
    } catch (error) {
      setDraft(text);
      toast(getApiError(error), "error");
    } finally {
      setSending(false);
    }
  };

  if (!activeChatId || !chat || !person) {
    return (
      <main className="chat-welcome">
        <div className="welcome-art">
          <div className="welcome-orbit orbit-one" /><div className="welcome-orbit orbit-two" />
          <span className="welcome-bubble bubble-one"><span>Hey there!</span><i /></span>
          <span className="welcome-bubble bubble-two"><span>Good to hear from you</span><i /></span>
          <span className="welcome-center"><Sparkles size={29} /></span>
        </div>
        <p className="eyebrow">A LITTLE CLOSER, EVERY DAY</p>
        <h2>Every good thing<br />starts with <em>hello.</em></h2>
        <p className="welcome-copy">Pick a conversation or find someone new.<br />Your people are just a message away.</p>
        <div className="welcome-hint"><span className="hint-dot" /> Your conversations are private</div>
      </main>
    );
  }

  return (
    <main className="chat-panel">
      <header className="chat-header">
        <button className="icon-button mobile-only back-button" aria-label="Back to conversations" onClick={onBack}><ArrowLeft size={20} /></button>
        <button className="chat-person" onClick={() => onProfile(person)}>
          <Avatar user={person} size="md" showStatus />
          <span><strong>{person.name}</strong><small><i className={`presence-dot ${person.status === "online" ? "online" : ""}`} />{person.status === "online" ? "Online now" : "Away"}</small></span>
        </button>
        <div className="chat-header-actions">
          <span className="encrypted-label"><span className="lock-symbol">✳</span> A good place to catch up</span>
          <button className="icon-button" aria-label="More conversation options"><MoreHorizontal size={21} /></button>
        </div>
      </header>

      <div className="chat-day-label"><span /> This is the beginning of something <span /></div>

      <div className="message-list" ref={listRef} onScroll={(event) => {
        const element = event.currentTarget;
        setShowScroll(element.scrollHeight - element.scrollTop - element.clientHeight > 240);
        if (element.scrollTop < 50) void loadOlder();
      }}>
        {loadingOlder && <div className="older-loader"><LoaderCircle size={17} className="spin" /> Loading earlier messages</div>}
        {loading ? (
          <div className="messages-loading"><span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" /></div>
        ) : chatMessages.length ? chatMessages.map((message) => (
          <MessageBubble key={message.id} message={message} mine={message.senderId === user?.id} senderName={message.senderId === user?.id ? "You" : person.name} />
        )) : (
          <div className="empty-chat-note"><span>☀</span><strong>A fresh start</strong><p>Send {person.name.split(" ")[0]} a little hello.</p></div>
        )}
        {activeChatId && typingUsers[activeChatId] && (
          <div className="typing-indicator"><span className="typing-dots"><i /><i /><i /></span> {typingUsers[activeChatId]} is typing</div>
        )}
        <div ref={bottomRef} />
      </div>
      {showScroll && <button className="scroll-latest" onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}><ArrowDown size={16} /> Latest messages</button>}

      <div className="composer-wrap">
        <div className="composer">
          <button className="composer-tool" aria-label="Attach a file" onClick={() => toast("File sharing is not enabled by this API yet.", "info")}><Paperclip size={19} /></button>
          <textarea
            aria-label="Write a message"
            placeholder={`Write ${person.name.split(" ")[0]} a message...`}
            value={draft}
            rows={1}
            onChange={(event) => notifyTyping(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
          />
          <button className="composer-tool emoji-button" aria-label="Add emoji" onClick={() => setDraft((current) => `${current}☺`)}><Smile size={19} /></button>
          <button className={`send-button ${draft.trim() ? "send-ready" : ""}`} disabled={!draft.trim() || sending} aria-label="Send message" onClick={() => void send()}>
            {sending ? <LoaderCircle size={17} className="spin" /> : <Send size={17} />}
          </button>
        </div>
        <div className="composer-footnote"><span><Check size={12} /> Enter to send</span><span>Shift + Enter for a new line</span>{chat.lastMessage?.createdAt && <span className="last-active">Last message {formatTime(chat.lastMessage.createdAt)}</span>}</div>
      </div>
    </main>
  );
}
