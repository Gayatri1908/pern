// ============================================================
// useAuth — authentication state hook
// ============================================================
"use client";
import { useState, useEffect, useCallback } from "react";
import { apiFetch, clearTokens, getToken, setTokens } from "@/lib/api";
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
    if (!token) { setState(s => ({ ...s, isLoading: false })); return; }
    try {
      const user = await apiFetch<User>("/api/v1/auth/me");
      setState({ user, token, isLoading: false, isAuthenticated: true });
    } catch {
      clearTokens();
      setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<{
      access_token: string; refresh_token: string; user: User;
    }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    } as Parameters<typeof apiFetch>[1]);
    setTokens(data.access_token, data.refresh_token);
    setState({ user: data.user, token: data.access_token, isLoading: false, isAuthenticated: true });
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
    window.location.href = "/login";
  }, []);

  return { ...state, login, logout, reload: loadUser };
}
