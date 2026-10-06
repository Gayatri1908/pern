// ============================================================
// useAuth — authentication state hook for PERN Case Study
// ============================================================
"use client";
import { useState, useEffect, useCallback } from "react";
import { api, clearTokens, getToken, setToken, setStoredUser, getStoredUser } from "@/lib/api";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const loadUser = useCallback(async () => {
    const token = getToken();
    const stored = getStoredUser();
    if (!token) {
      setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const res = await api.auth.me();
      if (res && res.user) {
        setStoredUser(res.user);
        setState({ user: res.user, token, isLoading: false, isAuthenticated: true });
      } else {
        throw new Error("Failed to load user");
      }
    } catch {
      if (stored) {
        setState({ user: stored, token, isLoading: false, isAuthenticated: true });
      } else {
        clearTokens();
        setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
      }
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    if (res && res.token) {
      setState({ user: res.user, token: res.token, isLoading: false, isAuthenticated: true });
      return res.user;
    }
    throw new Error("Login failed");
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
    window.location.href = "/login";
  }, []);

  return { ...state, login, logout, reload: loadUser };
}
