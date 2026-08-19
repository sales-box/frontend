import { create } from "zustand";
import {
  savePlatformSession,
  clearPlatformSession,
  isPlatformLoggedIn,
} from "../platform-client";

interface PlatformAuthState {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

// A separate store from the tenant `auth` store — the operator session lives
// under its own token and must not read/write the tenant-admin session.
export const usePlatformAuthStore = create<PlatformAuthState>((set) => ({
  isAuthenticated: isPlatformLoggedIn(),
  login: (token) => {
    savePlatformSession(token);
    set({ isAuthenticated: true });
  },
  logout: () => {
    clearPlatformSession();
    set({ isAuthenticated: false });
  },
}));
