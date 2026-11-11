import { create } from "zustand";

type Theme = "light" | "dark";
interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

const initialTheme: Theme =
  localStorage.getItem("gather.theme") === "dark" ||
  (!localStorage.getItem("gather.theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ? "dark"
    : "light";

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initialTheme,
  toggleTheme: () => set((state) => {
    const theme = state.theme === "light" ? "dark" : "light";
    localStorage.setItem("gather.theme", theme);
    return { theme };
  }),
}));
