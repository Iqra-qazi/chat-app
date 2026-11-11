const TOKEN_KEY = "gather.auth.token";
const USER_KEY = "gather.auth.user";

export function readToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function readUser<T>(): T | null {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    sessionStorage.removeItem(USER_KEY);
    return null;
  }
}

export function saveAuth(token: string | undefined, user: unknown): void {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthStorage(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}
