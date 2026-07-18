import { create } from "zustand";

interface ThemeState {
  dark: boolean;
  toggleDark: () => void;
  setDark: (dark: boolean) => void;
}

const getInitialTheme = (): boolean => {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem("theme");
  if (stored) return stored === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

export const useThemeStore = create<ThemeState>((set) => {
  const initialDark = getInitialTheme();
  
  if (typeof window !== "undefined") {
    document.documentElement.classList.toggle("dark", initialDark);
  }

  return {
    dark: initialDark,
    toggleDark: () =>
      set((state) => {
        const next = !state.dark;
        localStorage.setItem("theme", next ? "dark" : "light");
        document.documentElement.classList.toggle("dark", next);
        return { dark: next };
      }),
    setDark: (dark) =>
      set(() => {
        localStorage.setItem("theme", dark ? "dark" : "light");
        document.documentElement.classList.toggle("dark", dark);
        return { dark };
      }),
  };
});
