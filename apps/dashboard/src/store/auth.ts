import { create } from "zustand";
import {
  saveSession, clearSession, getUserInfo, isLoggedIn, setCompanyName,
  type UserInfo,
} from "../api-client";

interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo;
  login: (token: string, tenantId?: string) => void;
  logout: () => void;
  setCompany: (name: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: isLoggedIn(),
  user: getUserInfo(),

  login: (token, tenantId) => {
    saveSession(token, tenantId);
    set({ isAuthenticated: true, user: getUserInfo() });
  },

  logout: () => {
    clearSession();
    set({ isAuthenticated: false, user: getUserInfo() });
  },

  setCompany: (name) => {
    setCompanyName(name);
    set({ user: getUserInfo() });
  },
}));
