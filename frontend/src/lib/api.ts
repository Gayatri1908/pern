// ============================================================
// PERN Technical Case Study — API Client
// Centralized fetch client with JWT token management and typing
// ============================================================

import type {
  User, Customer, Product, Enquiry, Quotation, SalesOrder
} from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ── Token Storage ──
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function setToken(token: string): void {
  localStorage.setItem('access_token', token);
}

export function clearTokens(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const str = localStorage.getItem('user');
  if (!str) return null;
  try { return JSON.parse(str); } catch { return null; }
}

export function setStoredUser(user: User): void {
  localStorage.setItem('user', JSON.stringify(user));
}

// ── Generic API Fetch Wrapper ──
export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// ── Core API Modules ──
export const api = {
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      const res = await apiFetch<{
        success: boolean;
        token: string;
        access_token: string;
        user: User;
      }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
      if (res.token) {
        setToken(res.token);
        setStoredUser(res.user);
      }
      return res;
    },
    me: () => apiFetch<{ success: boolean; user: User }>('/api/v1/auth/me'),
  },

  customers: {
    list: () => apiFetch<{ success: boolean; count: number; data: Customer[] }>('/api/v1/customers'),
    create: (data: { name: string; email: string; phone?: string; company: string; address?: string }) =>
      apiFetch<{ success: boolean; data: Customer }>('/api/v1/customers', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
  },

  products: {
    list: () => apiFetch<{ success: boolean; count: number; data: Product[] }>('/api/v1/products'),
    get: (id: string) => apiFetch<{ success: boolean; data: Product }>(`/api/v1/products/${id}`),
    updateStock: (id: string, physical_quantity: number) =>
      apiFetch<{ success: boolean; message: string; data: Product }>(`/api/v1/products/${id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ physical_quantity })
      }),
  },

  enquiries: {
    list: () => apiFetch<{ success: boolean; count: number; data: Enquiry[] }>('/api/v1/enquiries'),
    get: (id: string) => apiFetch<{ success: boolean; data: Enquiry }>(`/api/v1/enquiries/${id}`),
    create: (data: { customer_id: string; notes?: string; items: Array<{ product_id: string; quantity: number; target_price?: number; notes?: string }> }) =>
      apiFetch<{ success: boolean; message: string; data: Enquiry }>('/api/v1/enquiries', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
  },

  quotations: {
    list: () => apiFetch<{ success: boolean; count: number; data: Quotation[] }>('/api/v1/quotations'),
    get: (id: string) => apiFetch<{ success: boolean; data: Quotation }>(`/api/v1/quotations/${id}`),
    create: (data: {
      enquiry_id: string;
      discount_pct?: number;
      gst_rate_pct?: number;
      valid_until?: string;
      items: Array<{ product_id: string; quantity: number; unit_price: number }>;
    }) =>
      apiFetch<{ success: boolean; message: string; data: Quotation }>('/api/v1/quotations', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    send: (id: string) =>
      apiFetch<{ success: boolean; message: string; data: Quotation }>(`/api/v1/quotations/${id}/send`, {
        method: 'PATCH'
      }),
    decide: (id: string, decision: 'ACCEPTED' | 'REJECTED') =>
      apiFetch<{ success: boolean; message: string; data: Quotation }>(`/api/v1/quotations/${id}/decision`, {
        method: 'PATCH',
        body: JSON.stringify({ decision })
      }),
    convertToOrder: (id: string) =>
      apiFetch<{ success: boolean; message: string; data: SalesOrder }>(`/api/v1/quotations/${id}/convert-to-order`, {
        method: 'POST'
      }),
  },

  salesOrders: {
    list: () => apiFetch<{ success: boolean; count: number; data: SalesOrder[] }>('/api/v1/sales-orders'),
    get: (id: string) => apiFetch<{ success: boolean; data: SalesOrder }>(`/api/v1/sales-orders/${id}`),
    confirm: (id: string) =>
      apiFetch<{ success: boolean; message: string; data: SalesOrder }>(`/api/v1/sales-orders/${id}/confirm`, {
        method: 'POST'
      }),
    dispatch: (id: string, data?: { tracking_number?: string; notes?: string }) =>
      apiFetch<{ success: boolean; message: string; data: SalesOrder }>(`/api/v1/sales-orders/${id}/dispatch`, {
        method: 'POST',
        body: JSON.stringify(data || {})
      }),
  }
};
