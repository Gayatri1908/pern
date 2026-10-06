// ============================================================
// The Source Company — API Client
// Centralized fetch wrapper with auth, refresh, error handling
// ============================================================

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:8000` : "http://localhost:8000");

// ── Token Storage ──
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

export function clearTokens(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_id");
}

// ── Refresh Token Logic ──
let refreshPromise: Promise<string | null> | null = null;

async function attemptRefresh(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) { clearTokens(); return null; }
    const data = await res.json();
    setTokens(data.access_token, data.refresh_token ?? refresh);
    return data.access_token;
  } catch {
    clearTokens();
    return null;
  }
}

// ── Core Fetch ──
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth, ...fetchOpts } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOpts.headers as Record<string, string>),
  };

  const token = getToken();
  if (token && !skipAuth) headers["Authorization"] = `Bearer ${token}`;

  let res = await fetch(`${BASE_URL}${path}`, { ...fetchOpts, headers });

  // Auto-refresh on 401
  if (res.status === 401 && !skipAuth) {
    if (!refreshPromise) refreshPromise = attemptRefresh().finally(() => { refreshPromise = null; });
    const newToken = await refreshPromise;
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(`${BASE_URL}${path}`, { ...fetchOpts, headers });
    } else {
      clearTokens();
      if (typeof window !== "undefined") window.location.href = "/login";
      throw new Error("Session expired");
    }
  }

    if (!res.ok) {
      let detail = `Request failed (${res.status})`;
      try {
        const err = await res.json();
        detail = err.error ?? err.detail ?? detail;
      } catch { /* ignore */ }
      throw new Error(detail);
    }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

// ── API Namespaces ──
export const api = {
  // Auth
  auth: {
    login: (email: string, password: string) =>
      apiFetch("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      }),
    signup: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/auth/signup", { method: "POST", body: JSON.stringify(data), skipAuth: true }),
    refresh: () => apiFetch("/api/v1/auth/refresh", { method: "POST", body: JSON.stringify({ refresh_token: getRefreshToken() }), skipAuth: true }),
    me: () => apiFetch("/api/v1/auth/me"),
    logout: () => { clearTokens(); window.location.href = "/login"; },
    deactivate: (reason: string) => apiFetch("/api/v1/auth/users/me/deactivate", { method: "POST", body: JSON.stringify({ reason }) }),
    cancelDeactivation: () => apiFetch("/api/v1/auth/users/me/cancel-deactivation", { method: "POST" }),
  },

  // ── The Source Company Energy Platform ──
  energySystems: {
    list: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return apiFetch<{ success: boolean; count: number; data: import("@/types").EnergySystem[] }>(`/api/v1/energy-systems${q}`);
    },
    get: (id: string) =>
      apiFetch<{ success: boolean; data: import("@/types").EnergySystem }>(`/api/v1/energy-systems/${id}`),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch<{ success: boolean; data: import("@/types").EnergySystem }>(`/api/v1/energy-systems/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    telemetry: (id: string, range = "24h") =>
      apiFetch<{ success: boolean; system_id: string; range: string; stats: any; data: import("@/types").TelemetryRecord[] }>(
        `/api/v1/energy-systems/${id}/telemetry?range=${range}`
      ),
    health: (id: string) =>
      apiFetch<{ success: boolean; data?: any; overall_health_score: number; subsystems: any[]; components: any[]; active_warnings: any[] }>(
        `/api/v1/energy-systems/${id}/health`
      ),
  },

  monitoring: {
    overview: () =>
      apiFetch<{
        success: boolean;
        overview: import("@/types").MissionControlData;
        systems: import("@/types").EnergySystem[];
        recent_events: any[];
      }>("/api/v1/monitoring/overview"),
    live: () =>
      apiFetch<{ success: boolean; count: number; data: any[] }>("/api/v1/monitoring/live"),
  },

  telemetry: {
    systemHistory: (systemId: string, range = "24h", metric?: string) =>
      apiFetch<{ success: boolean; system_id: string; stats: any; data: import("@/types").TelemetryRecord[] }>(
        `/api/v1/energy-systems/${systemId}/telemetry?range=${range}${metric ? `&metric=${metric}` : ""}`
      ),
    all: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return apiFetch<{ success: boolean; count: number; data: import("@/types").TelemetryRecord[] }>(`/api/v1/telemetry${q}`);
    },
    record: (data: Record<string, unknown>) =>
      apiFetch<{ success: boolean; telemetry_id: number }>("/api/v1/telemetry", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  health: {
    fleet: () =>
      apiFetch<{ success: boolean; count: number; data: any[] }>("/api/v1/health"),
    system: (id: string) =>
      apiFetch<any>(`/api/v1/health/${id}`),
  },

  alerts: {
    list: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return apiFetch<{ success: boolean; count: number; data: import("@/types").PlatformAlert[] }>(`/api/v1/alerts${q}`);
    },
    acknowledge: (id: string) =>
      apiFetch<{ success: boolean; data: import("@/types").PlatformAlert }>(`/api/v1/alerts/${id}/acknowledge`, {
        method: "PATCH",
      }),
    resolve: (id: string, notes?: string) =>
      apiFetch<{ success: boolean; data: import("@/types").PlatformAlert }>(`/api/v1/alerts/${id}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ resolution_notes: notes }),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch<{ success: boolean; data: any }>(`/api/v1/alerts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    create: (data: Record<string, unknown>) =>
      apiFetch<{ success: boolean; data: import("@/types").PlatformAlert }>("/api/v1/alerts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  analytics: {
    summary: () => apiFetch("/api/v1/analytics/summary"),
    energyAnalytics: (systemId?: string, period = "7d") =>
      apiFetch<{
        success: boolean;
        period: string;
        summary: any;
        daily_generation: any[];
        system_comparison: any[];
        hourly_profile: any[];
      }>(`/api/v1/analytics/energy?period=${period}${systemId ? `&system_id=${systemId}` : ""}`),
    energyChart: (period: "hourly" | "daily" | "monthly" | "yearly", productId?: string) =>
      apiFetch(`/api/v1/analytics/energy?period=${period}${productId ? `&product_id=${productId}` : ""}`),
  },

  components: {
    list: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return apiFetch<{ success: boolean; count: number; data: import("@/types").SystemComponent[] }>(`/api/v1/components${q}`);
    },
    get: (id: string) =>
      apiFetch<{ success: boolean; data: import("@/types").SystemComponent }>(`/api/v1/components/${id}`),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch<{ success: boolean; data: import("@/types").SystemComponent }>(`/api/v1/components/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  maintenance: {
    list: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return apiFetch<{ success: boolean; count: number; data: import("@/types").OperationalMaintenanceRecord[] }>(`/api/v1/maintenance${q}`);
    },
    create: (data: Record<string, unknown>) =>
      apiFetch<{ success: boolean; data: import("@/types").OperationalMaintenanceRecord }>("/api/v1/maintenance", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch<{ success: boolean; data: import("@/types").OperationalMaintenanceRecord }>(`/api/v1/maintenance/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    listForProduct: (productId: string) => apiFetch(`/api/v1/products/${productId}/maintenance`),
  },

  admin: {
    users: () =>
      apiFetch<{ success: boolean; count: number; data: any[] }>("/api/v1/admin/users"),
    createUser: (data: Record<string, unknown>) =>
      apiFetch<{ success: boolean; data: any }>("/api/v1/admin/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getConfig: (systemId: string) =>
      apiFetch<{ success: boolean; data: import("@/types").SystemConfiguration }>(`/api/v1/admin/systems/${systemId}/config`),
    updateConfig: (systemId: string, data: Record<string, unknown>) =>
      apiFetch<{ success: boolean; data: import("@/types").SystemConfiguration }>(`/api/v1/admin/systems/${systemId}/config`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    auditLogs: () =>
      apiFetch<{ success: boolean; count: number; data: any[] }>("/api/v1/admin/audit-logs"),
  },

  // Legacy compat aliases
  products: {
    myProducts: () => apiFetch("/api/v1/products/my-products"),
    list: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return apiFetch(`/api/v1/products${q}`);
    },
    get: (id: string) => apiFetch(`/api/v1/products/${id}`),
    create: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/products", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/v1/products/${id}`, { method: "DELETE" }),
    telemetry: (id: string, hours = 24) => apiFetch(`/api/v1/products/${id}/telemetry?hours=${hours}`),
    maintenance: (id: string) => apiFetch(`/api/v1/products/${id}/maintenance`),
  },


  // Users (Admin)
  users: {
    list: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return apiFetch(`/api/v1/auth/users${q}`);
    },
    listPending: () => apiFetch("/api/v1/auth/users/pending"),
    get: (id: string) => apiFetch(`/api/v1/auth/users/${id}`),
    create: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/auth/users", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/auth/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    approve: (id: string, notes?: string) =>
      apiFetch(`/api/v1/auth/users/${id}/approve`, { method: "POST", body: JSON.stringify({ notes }) }),
    reject: (id: string, notes?: string) =>
      apiFetch(`/api/v1/auth/users/${id}/reject`, { method: "POST", body: JSON.stringify({ notes }) }),
    delete: (id: string) => apiFetch(`/api/v1/auth/users/${id}`, { method: "DELETE" }),
  },


  // Complaints
  complaints: {
    list: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return apiFetch(`/api/v1/complaints${q}`);
    },
    create: (data: FormData | Record<string, unknown>) =>
      apiFetch("/api/v1/complaints", {
        method: "POST",
        body: data instanceof FormData ? data : JSON.stringify(data),
        headers: data instanceof FormData ? {} : { "Content-Type": "application/json" },
      }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/v1/complaints/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  },

  // Registration Requests
  registrations: {
    list: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return apiFetch(`/api/v1/products/registration-requests${q}`);
    },
    review: (id: string, status: "approved" | "rejected", notes?: string) =>
      apiFetch(`/api/v1/products/registration-requests/${id}/review`, {
        method: "POST",
        body: JSON.stringify({ status, notes }),
      }),
    create: (data: Record<string, unknown>) =>
      apiFetch("/api/v1/products/register", { method: "POST", body: JSON.stringify(data) }),
  },


  // Audit Logs
  audit: {
    list: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return apiFetch(`/api/v1/audit${q}`);
    },
  },

  // Reports
  reports: {
    energy: (params: Record<string, string>) => apiFetch("/api/v1/reports/energy?" + new URLSearchParams(params).toString()),
    alerts: (params: Record<string, string>) => apiFetch("/api/v1/reports/alerts?" + new URLSearchParams(params).toString()),
  },

  // Weather
  weather: {
    current: (lat: number, lng: number) => apiFetch(`/api/v1/weather?lat=${lat}&lng=${lng}`),
  },
};
