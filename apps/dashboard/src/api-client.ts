const BASE = import.meta.env.VITE_API_BASE_URL ?? "";
// Mock fallback is a standalone-demo aid only. It is OFF by default so real
// API failures (429, 500, network, oversize uploads) surface as errors the UI
// can show — never silently swapped for fake data. Set VITE_USE_MOCKS=true to
// run the dashboard without a backend.
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

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

function getMockDataForUrl(url: string): any {
  if (url.includes("/auth/me")) {
    return { tenantId: "mock-tenant-id", email: "admin@acme.com", isAdmin: true };
  }
  if (url.includes("/auth/admin/login")) {
    return { token: "header.eyJ0ZW5hbnRJZCI6Im1vY2stdGVuYW50LWlkIiwiZW1haWwiOiJhZG1pbkBhY21lLmNvbSIsImlzQWRtaW4iOnRydWV9.signature" };
  }
  if (url.startsWith("/tenants/signup")) {
    return { message: "Signup successful" };
  }
  if (url.startsWith("/tenants/resend-verification")) {
    return { message: "Verification email resent" };
  }
  if (url.includes("/tenants/")) {
    if (url.endsWith("/crm/status")) {
      return { connected: true, status: "connected", provider: "HubSpot", lastSync: new Date().toISOString() };
    }
    if (url.endsWith("/crm/mcp-status")) {
      return { connected: false };
    }
    if (url.endsWith("/allowlist")) {
      return [
        { id: "1", tenantId: "mock-tenant-id", email: "se1@acme.com", status: "verified", grantedAt: new Date().toISOString(), verifiedAt: new Date().toISOString(), revokedAt: null },
        { id: "2", tenantId: "mock-tenant-id", email: "se2@acme.com", status: "granted", grantedAt: new Date().toISOString(), verifiedAt: null, revokedAt: null },
      ];
    }
    return { id: "mock-tenant-id", companyName: "Acme Corporation", tier: 2, status: "active" };
  }
  if (url.includes("/knowledge-base/documents")) {
    return {
      data: [
        { id: "doc1", filename: "API_Spec.pdf", fileType: "pdf", status: "processed", chunkCount: 42, uploadDate: new Date().toISOString(), processingError: null, isLowConfidence: false, qualityReason: null },
        { id: "doc2", filename: "Product_Catalog.docx", fileType: "docx", status: "processed", chunkCount: 150, uploadDate: new Date().toISOString(), processingError: null, isLowConfidence: true, qualityReason: "Poor scan quality" },
      ],
      meta: { total: 2, lastPage: 1, currentPage: 1, limit: 50, prev: null, next: null }
    };
  }
  if (url.includes("/clients/")) {
    return {
      id: "c1", name: "John Doe", email: "john@stripe.com", company: "Stripe", status: "active", crmId: "crm_john", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      interactions: [
        { id: "i1", type: "email", subject: "Question about API limits", aiSummary: "Client asked if they can exceed the default 100 req/sec limit. Suggested tier upgrade.", date: new Date().toISOString(), classification: "upgrade_query", productConfidence: 0.95, clientHistoryConfidence: 0.88, recommendation: "Approve limit increase to 150 req/sec" }
      ]
    };
  }
  if (url.includes("/clients")) {
    return {
      data: [
        { id: "c1", name: "John Doe", email: "john@stripe.com", company: "Stripe", status: "active", crmId: "crm_john", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "c2", name: "Jane Smith", email: "jane@netflix.com", company: "Netflix", status: "active", crmId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ],
      meta: { total: 2, lastPage: 1, currentPage: 1, limit: 10, prev: null, next: null }
    };
  }
  if (url.includes("/analytics/summary")) {
    return {
      totalEmailsProcessed: 1420,
      byClassification: { "product inquiry": 620, "demo request": 450, "support": 250, "follow-up": 100 },
      averageConfidence: 0.894,
      lowConfidenceCount: 15,
      momChangePct: 12,
      dailyCounts: [
        { date: "07-13", emails: 32 }, { date: "07-14", emails: 45 }, { date: "07-15", emails: 28 },
        { date: "07-16", emails: 50 }, { date: "07-17", emails: 64 }, { date: "07-18", emails: 48 }, { date: "07-19", emails: 70 },
      ],
      replies: { threads: 210 },
      aiReviewed: { count: 180, escalated: 15 },
    };
  }
  if (url.includes("/analytics/gaps/alerts")) {
    return [
      { id: "g1", topic: "Stripe Connect API changes", occurrences: 12, resolved: false, tenantId: "mock-tenant-id", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "g2", topic: "SAML SSO setup steps", occurrences: 8, resolved: false, tenantId: "mock-tenant-id", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
  }
  if (url.includes("/analytics/activity")) {
    return {
      data: [
        { id: "act1", time: "14:22", client: "John Doe", company: "Stripe", classification: "Sales Inquiry", confidence: 92, action: "Replied" },
        { id: "act2", time: "12:05", client: "Jane Smith", company: "Netflix", classification: "Support", confidence: 85, action: "Drafted" },
      ],
      meta: { total: 2, lastPage: 1, currentPage: 1, limit: 50, prev: null, next: null }
    };
  }
  if (url.includes("/analytics/escalations")) {
    return {
      data: [
        {
          id: "esc1",
          messageId: "msg-esc-1",
          accountEmail: "se1@acme.com",
          severity: "high",
          reason: "Contract termination threat & legal escalation",
          status: "pending",
          reviewedBy: null,
          reviewedAt: null,
          createdAt: new Date().toISOString(),
          analysis: { intent: "sensitive", intentConfidence: 0.95, isUrgent: true, urgencyReason: "Legal threat", reasoning: "Customer threatened legal action over contract clause", supervisorLabel: "red", createdAt: new Date().toISOString() },
          client: { name: "John Customer", email: "john@enterprise.com", company: "Enterprise Co" },
          subject: "URGENT: Contract Violation Notice",
        },
      ],
      meta: { total: 1, lastPage: 1, currentPage: 1, limit: 50, prev: null, next: null }
    };
  }
  return {};
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  try {
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
      // Prefer the API's own message. Nest puts a human sentence in `message`,
      // and the CRM connect routes now rely on it to say things like which
      // provider is already connected, or why an MCP URL was rejected —
      // detail that "400 Bad Request: {…}" throws away.
      let apiMessage = "";
      try {
        const parsed = JSON.parse(body) as { message?: string | string[] };
        apiMessage = Array.isArray(parsed.message)
          ? parsed.message.join(", ")
          : (parsed.message ?? "");
      } catch {
        // Not JSON — fall through to the status line.
      }
      throw new Error(
        apiMessage || `${res.status} ${res.statusText}: ${body}`,
      );
    }
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  } catch (err) {
    if (USE_MOCKS) {
      console.warn("API request failed, using mock data (VITE_USE_MOCKS):", url, err);
      return getMockDataForUrl(url) as T;
    }
    throw err;
  }
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

export interface ResendVerificationPayload {
  email: string;
  companyName?: string;
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

  resendVerification: (data: ResendVerificationPayload) =>
    request<{ message: string }>("/tenants/resend-verification", { method: "POST", ...json(data) }),

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

export interface QualityReport {
  score: number;
  passed: string[];
  failed: { category: string; asks: string }[];
  ruleKeys: string[];
  redundancyRatio: number;
  concisenessScore: number;
  duplicateChunkPairs: number;
  evaluatedAt: string;
}

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
  qualityScore: number | null;
  qualityReport: QualityReport | null;
}

export interface PaginationMeta {
  total: number;
  lastPage: number;
  currentPage: number;
  limit: number;
  prev: number | null;
  next: number | null;
}

export interface RubricCriterion {
  category: string;
  /** The question the scorer asks of every document. */
  asks: string;
  /** A line that would satisfy it. */
  example: string;
  /** Points it is worth, out of 100. */
  worth: number;
}

export interface QualityCriteria {
  criteria: RubricCriterion[];
  /** Score bands, published by the backend so the two cannot disagree. */
  bands: { good: number; fair: number };
}

export interface QualityGap {
  category: string;
  asks: string;
  example: string;
  /** Points closing this gap would gain. */
  worth: number;
}

/** What a file would score, computed without storing it. */
export interface QualityPreview {
  filename: string;
  score: number;
  chunks: number;
  isLowConfidence: boolean;
  qualityReason?: string;
  covers: string[];
  gaps: QualityGap[];
  /**
   * Always false. Repetition needs chunk embeddings, which need storage — so a
   * preview genuinely cannot measure it, and says so rather than leaving the
   * absence to read as a perfect result.
   */
  redundancyMeasured: boolean;
}

/** Which half of the hybrid search surfaced a passage. */
export type KbFoundBy = "semantic" | "keyword" | "both";

/**
 * How well a passage really matches. Vector search always returns its top
 * results, so a "weak" hit means it came back without answering anything.
 */
export type KbMatchStrength = "strong" | "moderate" | "weak";

export interface KbSearchHit {
  chunkId: string;
  documentId: string;
  filename: string;
  chunkIndex: number | null;
  content: string;
  /** Null for keyword-only hits — that half has no comparable score. */
  similarity: number | null;
  strength: KbMatchStrength;
  foundBy: KbFoundBy;
  isLowConfidence: boolean;
}

export interface KbSearchResult {
  question: string;
  outcome: "ok" | "weak_match" | "no_match" | "empty_knowledge_base";
  tookMs: number;
  candidates: { semantic: number; keyword: number };
  hits: KbSearchHit[];
}

export const knowledgeBase = {
  list: (page = 1, limit = 50) =>
    request<{ data: KBDocument[]; meta: PaginationMeta }>(
      `/knowledge-base/documents?page=${page}&limit=${limit}`
    ),

  /** What the quality score measures and what each part is worth. */
  criteria: () =>
    request<QualityCriteria>("/knowledge-base/quality/criteria"),

  /**
   * Score a file WITHOUT storing it. Safe to run on a file you may not keep —
   * a real upload would already have replaced any existing document of the
   * same name before returning a score.
   */
  previewQuality: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<QualityPreview>("/knowledge-base/quality/preview", {
      method: "POST",
      body: form,
    });
  },

  /**
   * Ask the knowledge base a question and see what the AI would retrieve.
   * Runs real retrieval and stops before the LLM — no reply is generated.
   */
  test: (question: string) =>
    request<KbSearchResult>("/knowledge-base/test", {
      method: "POST",
      ...json({ question }),
    }),

  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ filename: string; chunksCreated: number; status: string; isLowConfidence: boolean; qualityReason: string | null }>(
      "/knowledge-base/upload", { method: "POST", body: form }
    );
  },

  uploadWithProgress: (
    file: File,
    onProgress: (pct: number) => void,
  ): { promise: Promise<{ filename: string; chunksCreated: number; status: string; isLowConfidence: boolean; qualityReason: string | null }>; abort: () => void } => {
    const form = new FormData();
    form.append("file", file);
    const xhr = new XMLHttpRequest();
    const promise = new Promise<{ filename: string; chunksCreated: number; status: string; isLowConfidence: boolean; qualityReason: string | null }>((resolve, reject) => {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
      xhr.addEventListener("load", () => {
        if (xhr.status === 401) {
          clearSession();
          window.location.replace("/signin");
          reject(new Error("Session expired"));
          return;
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); } catch { resolve(undefined as any); }
        } else {
          let msg = "";
          try { msg = JSON.parse(xhr.responseText)?.message ?? ""; } catch { /* */ }
          reject(new Error(msg || `${xhr.status} ${xhr.statusText}`));
        }
      });
      xhr.addEventListener("error", () => reject(new Error("Network error")));
      xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));
      xhr.open("POST", `${BASE}/knowledge-base/upload`);
      const hdrs = authHeaders();
      Object.entries(hdrs).forEach(([k, v]) => xhr.setRequestHeader(k, v));
      xhr.send(form);
    });
    return { promise, abort: () => xhr.abort() };
  },

  delete: (id: string) =>
    request<void>(`/knowledge-base/documents/${id}`, { method: "DELETE" }),

  /** Empties the whole knowledge base. Admin-only, and there is no restore. */
  deleteAll: () =>
    request<{ deleted: number }>("/knowledge-base/documents", { method: "DELETE" }),
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

export interface ZohoMcpStatus {
  connected: boolean;
  updatedAt?: string;
}

export const crm = {
  status: (id?: string) =>
    request<CRMStatus>(`/tenants/${id ?? tenantId()}/crm/status`),

  connect: (provider: string, apiKey: string, id?: string) =>
    request<{ message: string; importedCount: number; status: string }>(
      `/tenants/${id ?? tenantId()}/crm/connect`,
      { method: "POST", ...json({ provider, apiKey }) }
    ),

  disconnect: (id?: string) =>
    request<{ message: string; removedClients: number; status: string }>(
      `/tenants/${id ?? tenantId()}/crm/disconnect`,
      { method: "DELETE" }
    ),

  mcpStatus: (id?: string) =>
    request<ZohoMcpStatus>(`/tenants/${id ?? tenantId()}/crm/mcp-status`),

  connectMcp: (mcpServerUrl: string, id?: string) =>
    request<{ message: string; connected: boolean; mcpServerUrl: string }>(
      `/tenants/${id ?? tenantId()}/crm/connect-mcp`,
      { method: "POST", ...json({ mcpServerUrl }) }
    ),

  disconnectMcp: (id?: string) =>
    request<{ message: string; connected: boolean }>(
      `/tenants/${id ?? tenantId()}/crm/disconnect-mcp`,
      { method: "DELETE" }
    ),
};

// ─── Analytics ───────────────────────────────────────────────

export interface AnalyticsSummary {
  totalEmailsProcessed: number;
  byClassification: Record<string, number>;
  averageConfidence: number;
  lowConfidenceCount: number;
  momChangePct: number | null;
  dailyCounts: { date: string; emails: number }[];
  replies: { threads: number };
  aiReviewed: { count: number; escalated: number };
}

export interface KnowledgeGap {
  id: string;
  topic: string;
  occurrences: number;
  resolved: boolean;
  tenantId: string | null;
  createdAt: string;
  updatedAt: string;
  evidence: Array<{
    reportedAt: string;
    subject: string;
    summary: string;
    classification: string | null;
    emailDate: string;
    sender: {
      name: string | null;
      email: string;
      company: string | null;
    };
  }>;
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

export interface EscalationItem {
  id: string;
  messageId: string;
  accountEmail: string;
  severity: "high" | "medium" | "low";
  reason: string;
  status: "pending" | "reviewed" | "dismissed";
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  analysis: {
    intent: string;
    intentConfidence: number;
    isUrgent: boolean;
    urgencyReason: string | null;
    reasoning: string | null;
    supervisorLabel: string | null;
    createdAt: string;
  } | null;
  client: {
    name: string | null;
    email: string;
    company: string | null;
  } | null;
  subject: string | null;
}

export interface EscalationsPage {
  data: EscalationItem[];
  meta: PaginationMeta;
}

export interface TeamMemberStats {
  email: string;
  status: "granted" | "verified" | "revoked";
  grantedAt: string;
  verifiedAt: string | null;
  lastLoginAt: string | null;
  emailsReceived: number;
  repliesSent: number;
  replyRate: number;
}

export const analytics = {
  summary: (days = 30) =>
    request<AnalyticsSummary>(`/analytics/summary?days=${days}`),

  gaps: (threshold = 3) =>
    request<KnowledgeGap[]>(`/analytics/gaps/alerts?threshold=${threshold}`),

  reportGap: (messageId: string) =>
    request<KnowledgeGap & { reportAdded: boolean }>("/analytics/gaps", { method: "POST", ...json({ messageId }) }),

  resolveGap: (gapId: string) =>
    request<KnowledgeGap>(`/analytics/gaps/${gapId}/resolve`, { method: "PATCH" }),

  /** Fetch cross-SE activity feed. GET /analytics/activity */
  getActivity: (page = 1, limit = 50, date?: string) =>
    request<ActivityPage>(
      `/analytics/activity?page=${page}&limit=${limit}${date ? `&date=${encodeURIComponent(date)}` : ""}`
    ),

  /** Per-SE activity: logins + email volume + reply rate. GET /analytics/team */
  team: () => request<TeamMemberStats[]>("/analytics/team"),

  /** Admin Escalation & Attention Feed. GET /analytics/escalations */
  getEscalations: (page = 1, limit = 50, status?: string, date?: string) =>
    request<EscalationsPage>(
      `/analytics/escalations?page=${page}&limit=${limit}${status ? `&status=${encodeURIComponent(status)}` : ""}${date ? `&date=${encodeURIComponent(date)}` : ""}`
    ),

  /** Mark escalation item as reviewed or dismissed. PATCH /analytics/escalations/:id/resolve */
  resolveEscalation: (id: string, status: "reviewed" | "dismissed" = "reviewed") =>
    request<EscalationItem>(`/analytics/escalations/${id}/resolve`, {
      method: "PATCH",
      ...json({ status }),
    }),
};

// ─── Payments ───────────────────────────────────────────────

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  status: string;
}

export const payments = {
  createIntent: (amount: number, tier?: number) =>
    request<PaymentIntent>("/payments/create-payment-intent", {
      method: "POST",
      ...json({ amount, ...(tier != null && { tier }) }),
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
