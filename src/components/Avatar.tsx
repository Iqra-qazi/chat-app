import { initials } from "../utils/format";
import type { User } from "../types";

const colors = ["avatar-peach", "avatar-lilac", "avatar-mint", "avatar-blue", "avatar-rose", "avatar-gold"];

export function Avatar({ user, size = "md", showStatus = false }: { user: Pick<User, "name" | "avatar" | "status" | "id">; size?: "sm" | "md" | "lg"; showStatus?: boolean }) {
  const color = colors[(user.name.charCodeAt(0) || 0) % colors.length];
  return (
    <span className={`avatar avatar-${size} ${color}`}>
      {user.avatar ? <img src={user.avatar} alt="" /> : <span>{initials(user.name)}</span>}
      {showStatus && <i className={`avatar-status ${user.status === "online" ? "is-online" : ""}`} />}
    </span>
  );
}
