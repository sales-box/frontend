// API client for the platform-operator console. Separate from the tenant
// `api-client.ts`: its own token (a distinct sessionStorage key) and its own
// 401 redirect, so an operator session never collides with a tenant-admin one.
import { PlatformApiError } from "./lib/platformError";

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

/**
 * Nest error bodies are `{ message: string | string[] }`. Pull the message out
 * so the UI has something to show; fall back to the status text rather than
 * dumping the raw body.
 */
async function readErrorMessage(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  try {
    const body = JSON.parse(text) as { message?: string | string[] };
    if (Array.isArray(body.message) && body.message.length) {
      return body.message.join(", ");
    }
    if (typeof body.message === "string" && body.message) {
      return body.message;
    }
  } catch {
    // Not JSON — fall through to the status text.
  }
  return res.statusText || `Request failed (${res.status})`;
}

async function request<T>(
  url: string,
  init?: RequestInit,
  // The login endpoint answers 401 for a wrong password. Redirecting on that
  // reloads the page and destroys the error before the operator can read it,
  // so login opts out.
  opts: { redirectOn401?: boolean } = {},
): Promise<T> {
  const { redirectOn401 = true } = opts;
  const res = await fetch(`${BASE}${url}`, {
    ...init,
    headers: {
      ...(_pjwt ? { Authorization: `Bearer ${_pjwt}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401 && redirectOn401) {
      clearPlatformSession();
      window.location.replace("/admin/login");
      throw new PlatformApiError(401, "Session expired");
    }
    throw new PlatformApiError(res.status, await readErrorMessage(res));
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
  createdAt: string;
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

/** Every bucket key is always present — the backend defaults them to 0. */
export interface PlatformStats {
  total: number;
  byStatus: Record<TenantStatus, number>;
  byTier: Record<number, number>;
  newThisWeek: number;
}

export interface TenantFilters {
  search?: string;
  status?: TenantStatus | "";
}

export const platformApi = {
  login: (email: string, password: string) =>
    request<{ token: string }>(
      "/platform/auth/login",
      { method: "POST", ...json({ email, password }) },
      { redirectOn401: false },
    ),

  getStats: () => request<PlatformStats>("/platform/tenants/stats"),

  listTenants: (page = 1, limit = 20, filters: TenantFilters = {}) => {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    const search = filters.search?.trim();
    if (search) qs.set("search", search);
    if (filters.status) qs.set("status", filters.status);
    return request<PaginatedTenants>(`/platform/tenants?${qs.toString()}`);
  },

  getTenant: (id: string) => request<TenantDetail>(`/platform/tenants/${id}`),

  changeStatus: (id: string, action: StatusAction) =>
    request<{ id: string; status: TenantStatus }>(
      `/platform/tenants/${id}/status`,
      { method: "PATCH", ...json({ action }) },
    ),

  /** Irreversible. Only permitted for an offboarded or abandoned tenant. */
  deleteTenant: (id: string) =>
    request<void>(`/platform/tenants/${id}`, { method: "DELETE" }),

  changeTier: (id: string, tier: number) =>
    request<{ id: string; tier: number }>(`/platform/tenants/${id}/tier`, {
      method: "PATCH",
      ...json({ tier }),
    }),
};
