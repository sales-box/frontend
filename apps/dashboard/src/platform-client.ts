// API client for the platform-operator console. Separate from the tenant
// `api-client.ts`: its own token (a distinct sessionStorage key) and its own
// 401 redirect, so an operator session never collides with a tenant-admin one.
const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

const PLATFORM_JWT_KEY = "platformJwt";
let _pjwt: string | null = sessionStorage.getItem(PLATFORM_JWT_KEY);

export function savePlatformSession(token: string): void {
  _pjwt = token;
  sessionStorage.setItem(PLATFORM_JWT_KEY, token);
}
export function clearPlatformSession(): void {
  _pjwt = null;
  sessionStorage.removeItem(PLATFORM_JWT_KEY);
}
export function isPlatformLoggedIn(): boolean {
  return !!_pjwt;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    ...init,
    headers: {
      ...(_pjwt ? { Authorization: `Bearer ${_pjwt}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    if (res.status === 401) {
      clearPlatformSession();
      window.location.replace("/admin/login");
      throw new Error("Session expired");
    }
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

function json(data: unknown): RequestInit {
  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}

export type TenantStatus =
  | "pending"
  | "active"
  | "suspended"
  | "abandoned"
  | "offboarded";
export type StatusAction = "activate" | "suspend" | "offboard";

export interface TenantSummary {
  id: string;
  companyName: string;
  status: TenantStatus;
  tier: number;
  seCount: number;
}

export interface PaginatedTenants {
  data: TenantSummary[];
  meta: {
    total: number;
    lastPage: number;
    currentPage: number;
    limit: number;
    prev: number | null;
    next: number | null;
  };
}

export interface TenantDetail {
  id: string;
  companyName: string;
  status: TenantStatus;
  tier: number;
  createdAt: string;
  seCount: number;
  docCount: number;
  emailCount: number;
  lastActivityAt: string | null;
}

export const platformApi = {
  login: (email: string, password: string) =>
    request<{ token: string }>("/platform/auth/login", {
      method: "POST",
      ...json({ email, password }),
    }),
  listTenants: (page = 1, limit = 20) =>
    request<PaginatedTenants>(`/platform/tenants?page=${page}&limit=${limit}`),
  getTenant: (id: string) => request<TenantDetail>(`/platform/tenants/${id}`),
  changeStatus: (id: string, action: StatusAction) =>
    request<{ id: string; status: TenantStatus }>(
      `/platform/tenants/${id}/status`,
      { method: "PATCH", ...json({ action }) },
    ),
  changeTier: (id: string, tier: number) =>
    request<{ id: string; tier: number }>(`/platform/tenants/${id}/tier`, {
      method: "PATCH",
      ...json({ tier }),
    }),
};
