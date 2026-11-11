import { create } from "zustand";
import type { User } from "../types";
import { clearAuthStorage, readUser, saveAuth } from "../services/authStorage";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string | undefined, user: User) => void;
  updateUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: readUser<User>(),
  isAuthenticated: Boolean(readUser<User>()),
  setAuth: (token, user) => {
    saveAuth(token, user);
    set({ user, isAuthenticated: true });
  },
  updateUser: (user) => {
    saveAuth(undefined, user);
    set({ user });
  },
  logout: () => {
    clearAuthStorage();
    set({ user: null, isAuthenticated: false });
  },
}));
