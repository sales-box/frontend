// src/api-client.ts
// Params prefixed with _ are intentionally unused — mock stubs for Sprint 3.
// They will be replaced with real fetch() calls when the backend is ready.

// ── Admin / Tenant ───────────────────────────────────────────────
export async function signup(_company: string, _email: string, _password: string, _tier: string): Promise<{ tenantId: string }> {
  return { tenantId: "mock-tenant-001" };
}

export async function verifyEmail(_token: string): Promise<{ verified: boolean }> {
  return { verified: true };
}

// ── Knowledge Base ────────────────────────────────────────────────
export async function listDocuments(): Promise<{ filename: string; uploadDate: string; chunkCount: number }[]> {
  return [
    { filename: "product-catalog.pdf", uploadDate: "2026-07-09", chunkCount: 42 },
    { filename: "pricing-guide.docx", uploadDate: "2026-07-08", chunkCount: 18 },
  ];
}

export async function uploadDocument(_file: File): Promise<{ status: "ok" | "quality_warning"; message?: string }> {
  return { status: "ok" };
}

export async function deleteDocument(_filename: string): Promise<void> {}

// ── Allowlist ─────────────────────────────────────────────────────
export async function getAllowlist(_tenantId: string): Promise<{ email: string; status: "pending" | "verified" | "revoked" }[]> {
  return [
    { email: "se1@company.com", status: "verified" },
    { email: "se2@company.com", status: "pending" },
  ];
}

export async function grantAccess(_tenantId: string, _email: string): Promise<void> {}
export async function revokeAccess(_tenantId: string, _email: string): Promise<void> {}

// ── CRM ───────────────────────────────────────────────────────────
export async function getCRMStatus(_tenantId: string): Promise<{ connected: boolean }> {
  return { connected: false };
}

// ── Analytics (matches CONTRACTS.md Role 4 — Khaled) ─────────────
export async function getAnalyticsSummary(_days = 7): Promise<{
  totalEmailsProcessed: number;
  byClassification: Record<string, number>;
  averageConfidence: number;
  lowConfidenceCount: number;
  topProducts: string[];
}> {
  return {
    totalEmailsProcessed: 128,
    byClassification: { product_inquiry: 74, meeting_request: 31, general: 23 },
    averageConfidence: 0.78,
    lowConfidenceCount: 14,
    topProducts: ["Solar Panel X200", "Battery Unit Pro", "Grid Controller"],
  };
}

export async function getKnowledgeGapAlerts(): Promise<{ id: string; topic: string; occurrences: number }[]> {
  return [
    { id: "gap-1", topic: "Warranty terms for X200", occurrences: 5 },
    { id: "gap-2", topic: "Installation lead time", occurrences: 3 },
  ];
}

export async function resolveGap(_id: string): Promise<void> {}

// ── SE / Extension (matches CONTRACTS.md Role 2) ─────────────────
// ⚠️ MOCK — POST /auth/se/login does not exist on the backend yet
export async function seLoginWithCode(_code: string): Promise<{ token: string } | { error: "invalid_allowlist" }> {
  return { token: "mock-se-jwt-token" };
}

export async function getClientContext(tenantId: string, email: string): Promise<{
  isNewClient: boolean;
  clientId: string | null;
  status: string;
  company: string;
  crmId: string | null;
  // NOTE: no productsDiscussed — field does not exist on this endpoint.
  // NOTE: no confidence fields — those only come from getSuggestion.
  history: {
    date: string;
    type: string;
    subject: string;
    summary: string | null;
    classification: string | null;   // added: real backend returns this
    recommendation: string | null;   // added: real backend returns this
  }[];
}> {
  // Using import.meta.env for Vite apps. If VITE_API_BASE_URL is undefined, we default to empty string,
  // which will cause fetch to throw or use relative path. I will report this back to the user.
  const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || "";
  const params = new URLSearchParams({ email });
  const res = await fetch(`${baseUrl}/clients/context?${params.toString()}`, {
    headers: {
      "x-tenant-id": tenantId,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch client context: ${res.statusText}`);
  }
  return res.json();
}


/**
 * Get AI-generated reply suggestion for an email thread.
 * ⚠️ MOCK — POST /ai/process always returns 501
 * Returns suggested reply + dual confidence scores.
 *
 * Confidence fields (productConfidence, clientHistoryConfidence) come ONLY
 * from this endpoint — never from getClientContext.
 *
 * Mock returns high-confidence data. To test LowConfidenceScreen,
 * return productConfidence < 70 and clientHistoryConfidence < 60.
 */
export async function getSuggestion(
  _tenantId: string,
  _emailId: string,
): Promise<{
  reply: string;
  productConfidence: number;   // 0–100 integer
  clientHistoryConfidence: number;   // 0–100 integer
  hasHallucination: boolean;
  clientName: string;
  company: string;
  role: string;
  dealStatus: "active" | "prospect";
  emailTimestamp: string;
}> {
  // Mock: swap to low numbers (e.g. 45, 38) to trigger LowConfidenceScreen
  return {
    reply:
      "Hi Marcus,\n\nThanks for reaching out. Based on our conversation last week, I wanted to follow up on the Solar Panel X200 pricing you requested.\n\nOur standard bulk pricing for 50+ units starts at $2,400/unit with a 90-day delivery window. Happy to arrange a technical demo this week if helpful.\n\nBest,",
    productConfidence: 82,
    clientHistoryConfidence: 65,
    hasHallucination: false,
    clientName: "Marcus Reid",
    company: "Brightwave Technologies",
    role: "VP Engineering",
    dealStatus: "active",
    emailTimestamp: new Date().toISOString(),
  };
}
