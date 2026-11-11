import { Check, CheckCheck } from "lucide-react";
import type { Message } from "../types";
import { formatMessageTime } from "../utils/format";

export function MessageBubble({ message, mine, senderName }: { message: Message; mine: boolean; senderName: string }) {
  return (
    <div className={`message-row ${mine ? "message-mine" : "message-theirs"}`}>
      {!mine && <span className="message-sender">{senderName}</span>}
      <div className="message-bubble">
        <p>{message.text}</p>
        <span className="message-meta">
          <time>{formatMessageTime(message.createdAt)}</time>
          {mine && (message.status === "sent" ? <Check size={13} /> : <CheckCheck size={14} className={message.status === "seen" ? "seen-check" : ""} />)}
        </span>
      </div>
    </div>
  );
}
