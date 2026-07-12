const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

let _jwt: string | null = sessionStorage.getItem("jwt");
let _tid: string | null = sessionStorage.getItem("tenantId");

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  if (_jwt) h["Authorization"] = `Bearer ${_jwt}`;
  if (_tid) h["x-tenant-id"] = _tid;
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
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json();
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
    const redirect = encodeURIComponent(`${window.location.origin}/callback`);
    window.location.href = `${BASE}/auth/google?redirect=${redirect}`;
  },

  adminLogin: (email: string, password: string) =>
    request<{ token: string; tenantId: string }>("/auth/admin/login", {
      method: "POST",
      ...json({ email, password }),
    }),

  setPassword: (email: string, password: string) =>
    request<{ success: boolean }>("/auth/admin/set-password", {
      method: "POST",
      ...json({ email, password }),
    }),
};

// ─── Tenants & Onboarding ────────────────────────────────────

export interface SignupPayload {
  companyName: string;
  adminEmail: string;
  adminName: string;
}
export interface Tenant {
  id: string;
  companyName: string;
  plan: string;
  seatLimit: number;
  verified: boolean;
}

export const tenants = {
  signup: (data: SignupPayload) =>
    request<{ tenantId: string }>("/tenants/signup", { method: "POST", ...json(data) }),

  verify: (token: string, email: string) =>
    request<{ success: boolean }>(`/tenants/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`),

  get: (id?: string) =>
    request<Tenant>(`/tenants/${id ?? tenantId()}`),
};

// ─── Knowledge Base ──────────────────────────────────────────

export interface KBDocument {
  id: string;
  name: string;
  size: string;
  status: "ready" | "processing" | "warning";
  uploaded: string;
  chunks: number | null;
}

export const knowledgeBase = {
  list: (page = 1, limit = 50) =>
    request<{ documents: KBDocument[]; total: number }>(
      `/knowledge-base/documents?page=${page}&limit=${limit}`
    ),

  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<KBDocument>("/knowledge-base/upload", {
      method: "POST",
      body: form,
    });
  },

  delete: (id: string) =>
    request<void>(`/knowledge-base/documents/${id}`, { method: "DELETE" }),
};

// ─── Access Control (Allowlist / Team) ───────────────────────

export interface SEMember {
  email: string;
  name: string;
  status: "Verified" | "Invited" | "Revoked";
  added: string;
}

export const allowlist = {
  list: (id?: string) =>
    request<{ members: SEMember[] }>(`/tenants/${id ?? tenantId()}/allowlist`),

  grant: (email: string, id?: string) =>
    request<SEMember>(`/tenants/${id ?? tenantId()}/allowlist`, {
      method: "POST",
      ...json({ email }),
    }),

  revoke: (email: string, id?: string) =>
    request<void>(
      `/tenants/${id ?? tenantId()}/allowlist/${encodeURIComponent(email)}`,
      { method: "DELETE" }
    ),
};

// ─── Clients ────────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  dealStage: string;
  status: string;
  lastContact: string;
  aiSummary?: string;
}

export interface Interaction {
  id: string;
  date: string;
  subject: string;
  classification: string;
  confidence: number;
  actionTaken: string;
}

export const clients = {
  list: (page = 1, limit = 10, search = "") =>
    request<{ clients: Client[]; total: number }>(
      `/clients?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ""}`
    ),

  get: (id: string) =>
    request<Client>(`/clients/${id}`),

  interactions: (clientId: string) =>
    request<{ interactions: Interaction[] }>(`/clients/${clientId}/interactions`),
};

// ─── CRM Integration ────────────────────────────────────────

export interface CRMStatus {
  connected: boolean;
  provider: string | null;
  lastSynced: string | null;
  contacts: number;
  deals: number;
}

export const crm = {
  status: (id?: string) =>
    request<CRMStatus>(`/tenants/${id ?? tenantId()}/crm/status`),

  connect: (provider: string, apiKey: string, id?: string) =>
    request<CRMStatus>(`/tenants/${id ?? tenantId()}/crm/connect`, {
      method: "POST",
      ...json({ provider, apiKey }),
    }),
};

// ─── Analytics ───────────────────────────────────────────────

export interface AnalyticsSummary {
  emailsProcessed: number;
  repliesSentAsIs: number;
  repliesEdited: number;
  activeSEs: number;
  totalSEs: number;
  avgConfidence: number;
  mostCommonType: string;
  escalatedCount: number;
  emailChartData: { date: string; emails: number }[];
  repChartData: { name: string; sent: number; edited: number }[];
}

export interface KnowledgeGap {
  id: string;
  topic: string;
  count: number;
  firstSeen: string;
  resolved: boolean;
}

export const analytics = {
  summary: (days = 30) =>
    request<AnalyticsSummary>(
      `/analytics/summary?days=${days}&tenantId=${tenantId()}`
    ),

  gaps: (threshold = 3) =>
    request<{ gaps: KnowledgeGap[] }>(
      `/analytics/gaps/alerts?threshold=${threshold}&tenantId=${tenantId()}`
    ),

  resolveGap: (gapId: string) =>
    request<void>(`/analytics/gaps/${gapId}/resolve`, { method: "PATCH" }),
};

// ─── Session helpers ─────────────────────────────────────────

export function saveSession(token: string, tid: string) {
  _jwt = token;
  _tid = tid;
  sessionStorage.setItem("jwt", token);
  sessionStorage.setItem("tenantId", tid);
}

export function clearSession() {
  _jwt = null;
  _tid = null;
  sessionStorage.removeItem("jwt");
  sessionStorage.removeItem("tenantId");
}

export function isLoggedIn(): boolean {
  return !!_jwt;
}
