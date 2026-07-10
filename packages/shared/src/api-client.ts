// src/api-client.ts

// ── Admin / Tenant ───────────────────────────────────────────────
export async function signup(company: string, email: string, password: string, tier: string): Promise<{ tenantId: string }> {
  return { tenantId: "mock-tenant-001" };
}

export async function verifyEmail(token: string): Promise<{ verified: boolean }> {
  return { verified: true };
}

// ── Knowledge Base ────────────────────────────────────────────────
export async function listDocuments(): Promise<{ filename: string; uploadDate: string; chunkCount: number }[]> {
  return [
    { filename: "product-catalog.pdf", uploadDate: "2026-07-09", chunkCount: 42 },
    { filename: "pricing-guide.docx", uploadDate: "2026-07-08", chunkCount: 18 },
  ];
}

export async function uploadDocument(file: File): Promise<{ status: "ok" | "quality_warning"; message?: string }> {
  return { status: "ok" };
}

export async function deleteDocument(filename: string): Promise<void> {}

// ── Allowlist ─────────────────────────────────────────────────────
export async function getAllowlist(tenantId: string): Promise<{ email: string; status: "pending" | "verified" | "revoked" }[]> {
  return [
    { email: "se1@company.com", status: "verified" },
    { email: "se2@company.com", status: "pending" },
  ];
}

export async function grantAccess(tenantId: string, email: string): Promise<void> {}
export async function revokeAccess(tenantId: string, email: string): Promise<void> {}

// ── CRM ───────────────────────────────────────────────────────────
export async function getCRMStatus(tenantId: string): Promise<{ connected: boolean }> {
  return { connected: false };
}

// ── Analytics (matches CONTRACTS.md Role 4 — Khaled) ─────────────
export async function getAnalyticsSummary(days = 7): Promise<{
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

export async function resolveGap(id: string): Promise<void> {}

// ── SE / Extension (matches CONTRACTS.md Role 2) ─────────────────
export async function seLogin(googleToken: string): Promise<{ jwt: string } | { error: "invalid_allowlist" }> {
  return { jwt: "mock-se-jwt-token" };
}

export async function getClientContext(tenantId: string, email: string): Promise<{
  isNewClient: boolean;
  clientId: string | null;
  status: string;
  company: string;
  productsDiscussed: string[];
  history: { date: string; type: string; subject: string; summary: string | null }[];
  crmId: string | null;
}> {
  return {
    isNewClient: false,
    clientId: "client-mock-001",
    status: "active",
    company: "Acme Corp",
    productsDiscussed: ["Solar Panel X200"],
    history: [
      { date: "2026-07-08", type: "inbound", subject: "Pricing inquiry", summary: "Asked about bulk pricing for X200", },
    ],
    crmId: "hubspot-mock-123",
  };
}
