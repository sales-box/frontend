const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

let _jwt: string | null = sessionStorage.getItem("jwt");
let _tid: string | null = sessionStorage.getItem("tenantId");
let _companyName: string | null = sessionStorage.getItem("companyName");

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  if (_jwt) h["Authorization"] = `Bearer ${_jwt}`;
  return h;
}

function tenantId(): string {
  return _tid ?? "";
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    ...init,
    headers: { ...authHeaders(), ...init?.headers },
  });
  if (!res.ok) {
    if (res.status === 401) {
      clearSession();
      window.location.replace("/signin");
      throw new Error("Session expired");
    }
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

function json(data: unknown): RequestInit {
  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}

// ─── Auth ────────────────────────────────────────────────────

export const auth = {
  googleStart: () => {
    window.location.href = `${BASE}/auth/google`;
  },

  adminLogin: (email: string, password: string) =>
    request<{ token: string }>("/auth/admin/login", {
      method: "POST",
      ...json({ email, password }),
    }),

  setPassword: (email: string, password: string, tid: string) =>
    request<{ linked: true }>("/auth/admin/set-password", {
      method: "POST",
      ...json({ email, password, tenantId: tid }),
    }),

  me: () =>
    request<{ tenantId: string; email: string; isAdmin: boolean }>("/auth/me"),
};

// ─── Tenants & Onboarding ────────────────────────────────────

export interface SignupPayload {
  companyName: string;
  adminEmail: string;
  adminName?: string;
}

export interface Tenant {
  id: string;
  companyName: string;
  tier: number;
  status: string;
}

export const tenants = {
  signup: (data: SignupPayload) =>
    request<{ message: string }>("/tenants/signup", { method: "POST", ...json(data) }),

  verify: (token: string, email: string) =>
    request<{ message: string; tenantId: string }>(
      `/tenants/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
    ),

  get: (id?: string) =>
    request<Tenant>(`/tenants/${id ?? tenantId()}`),

  /** Update company name. Calls PATCH /tenants/:id with { companyName }. */
  updateTenant: (companyName: string, id?: string) =>
    request<Tenant>(`/tenants/${id ?? tenantId()}`, {
      method: "PATCH",
      ...json({ companyName }),
    }),
};

// ─── Knowledge Base ──────────────────────────────────────────

export interface KBDocument {
  id: string;
  filename: string;
  fileType: string;
  status: string;
  chunkCount: number;
  uploadDate: string;
  processingError: string | null;
  isLowConfidence: boolean;
  qualityReason: string | null;
}

export interface PaginationMeta {
  total: number;
  lastPage: number;
  currentPage: number;
  limit: number;
  prev: number | null;
  next: number | null;
}

export const knowledgeBase = {
  list: (page = 1, limit = 50) =>
    request<{ data: KBDocument[]; meta: PaginationMeta }>(
      `/knowledge-base/documents?page=${page}&limit=${limit}`
    ),

  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ filename: string; chunksCreated: number; status: string; isLowConfidence: boolean; qualityReason: string | null }>(
      "/knowledge-base/upload", { method: "POST", body: form }
    );
  },

  delete: (id: string) =>
    request<void>(`/knowledge-base/documents/${id}`, { method: "DELETE" }),
};

// ─── Access Control (Allowlist / Team) ───────────────────────

export interface SEMember {
  id: string;
  tenantId: string;
  email: string;
  status: "granted" | "verified" | "revoked";
  grantedAt: string;
  verifiedAt: string | null;
  revokedAt: string | null;
}

export const allowlist = {
  list: (id?: string) =>
    request<SEMember[]>(`/tenants/${id ?? tenantId()}/allowlist`),

  grant: (email: string, id?: string) =>
    request<void>(`/tenants/${id ?? tenantId()}/allowlist`, {
      method: "POST",
      ...json({ email }),
    }),

  revoke: (email: string, id?: string) =>
    request<void>(
      `/tenants/${id ?? tenantId()}/allowlist/${encodeURIComponent(email)}`,
      { method: "DELETE" }
    ),

  offboard: (id?: string) =>
    request<void>(`/tenants/${id ?? tenantId()}/offboard`, { method: "POST" }),
};

// ─── Clients ────────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  status: string;
  crmId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Interaction {
  id: string;
  type: string;
  subject: string;
  aiSummary: string;
  date: string;
  classification: string | null;
  productConfidence: number | null;
  clientHistoryConfidence: number | null;
  recommendation: string | null;
}

export const clients = {
  list: (page = 1, limit = 10, search = "") =>
    request<{ data: Client[]; meta: PaginationMeta }>(
      `/clients?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ""}`
    ),

  get: (id: string) =>
    request<Client & { interactions: Interaction[] }>(`/clients/${id}`),

  interactions: (clientId: string, page = 1, limit = 20) =>
    request<{ data: Interaction[]; meta: PaginationMeta }>(
      `/clients/${clientId}/interactions?page=${page}&limit=${limit}`
    ),
};

// ─── CRM Integration ────────────────────────────────────────

export interface CRMStatus {
  connected: boolean;
  status: string;
  provider?: string | null;
  lastSync?: string | null;
}

export const crm = {
  status: (id?: string) =>
    request<CRMStatus>(`/tenants/${id ?? tenantId()}/crm/status`),

  connect: (provider: string, apiKey: string, id?: string) =>
    request<{ message: string; importedCount: number; status: string }>(
      `/tenants/${id ?? tenantId()}/crm/connect`,
      { method: "POST", ...json({ provider, apiKey }) }
    ),
};

// ─── Analytics ───────────────────────────────────────────────

export interface AnalyticsSummary {
  totalEmailsProcessed: number;
  byClassification: Record<string, number>;
  averageConfidence: number;
  lowConfidenceCount: number;
}

export interface KnowledgeGap {
  id: string;
  topic: string;
  occurrences: number;
  resolved: boolean;
  tenantId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEntry {
  id: string;
  /** HH:MM formatted local time */
  time: string;
  client: string;
  company: string;
  classification: string | null;
  /** Raw confidence value — confirm 0-100 vs 0-1 scale with backend before using directly */
  confidence: number | null; // TODO: confirm 0-100 vs 0-1 scale with backend
  action: string | null;
}

export interface ActivityPage {
  data: ActivityEntry[];
  meta: PaginationMeta;
}

export const analytics = {
  summary: (days = 30) =>
    request<AnalyticsSummary>(`/analytics/summary?days=${days}`),

  gaps: (threshold = 3) =>
    request<KnowledgeGap[]>(`/analytics/gaps/alerts?threshold=${threshold}`),

  reportGap: (topic: string) =>
    request<KnowledgeGap>("/analytics/gaps", { method: "POST", ...json({ topic }) }),

  resolveGap: (gapId: string) =>
    request<KnowledgeGap>(`/analytics/gaps/${gapId}/resolve`, { method: "PATCH" }),

  /** Fetch cross-SE activity feed. GET /analytics/activity */
  getActivity: (page = 1, limit = 50, date?: string) =>
    request<ActivityPage>(
      `/analytics/activity?page=${page}&limit=${limit}${date ? `&date=${encodeURIComponent(date)}` : ""}`
    ),
};

// ─── Payments ───────────────────────────────────────────────

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  status: string;
}

export const payments = {
  createIntent: (amount: number) =>
    request<PaymentIntent>("/payments/create-payment-intent", {
      method: "POST",
      ...json({ amount }),
    }),

  get: (id: string) =>
    request<PaymentIntent>(`/payments/${id}`),
};

// ─── Session helpers ─────────────────────────────────────────

function parseJwtPayload(token: string): Record<string, unknown> {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

export function saveSession(token: string, tid?: string) {
  const payload = parseJwtPayload(token);
  _jwt = token;
  _tid = tid ?? (payload.tenantId as string) ?? null;
  sessionStorage.setItem("jwt", token);
  if (_tid) sessionStorage.setItem("tenantId", _tid);
}

export function clearSession() {
  _jwt = null;
  _tid = null;
  _companyName = null;
  sessionStorage.removeItem("jwt");
  sessionStorage.removeItem("tenantId");
  sessionStorage.removeItem("companyName");
}

export function isLoggedIn(): boolean {
  if (!_jwt) return false;
  const p = parseJwtPayload(_jwt);
  if (p.exp && (p.exp as number) * 1000 < Date.now()) {
    clearSession();
    return false;
  }
  return true;
}

export interface UserInfo {
  email: string;
  name: string;
  initials: string;
  isAdmin: boolean;
  companyName: string;
}

export function getUserInfo(): UserInfo {
  if (!_jwt) return { email: "", name: "User", initials: "U", isAdmin: false, companyName: "" };
  const p = parseJwtPayload(_jwt);
  const email = (p.email as string) ?? "";
  const name = email ? email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "User";
  const parts = name.split(" ");
  const initials = parts.map(w => w[0]?.toUpperCase() ?? "").join("").slice(0, 2) || "U";
  return { email, name, initials, isAdmin: !!(p.isAdmin), companyName: _companyName ?? "" };
}

export function setCompanyName(name: string) {
  _companyName = name;
  sessionStorage.setItem("companyName", name);
}
