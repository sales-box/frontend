// src/api-client.ts

const API_BASE = 'https://salesbox.dev'

// ── SE / Extension (matches CONTRACTS.md Role 2) ─────────────────

/**
 * Exchange a Google OAuth authorization code for an SE JWT.
 * Real endpoint: POST /auth/se/login
 * Returns { token } on 200, or { error: "invalid_allowlist" } on 403.
 */
export async function seLoginWithCode(code: string, redirectUri: string): Promise<{ token: string } | { error: "invalid_allowlist" }> {
  const res = await fetch(`${API_BASE}/auth/se/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirectUri }),
  })
  if (res.status === 403) {
    return { error: 'invalid_allowlist' }
  }
  if (!res.ok) {
    throw new Error(`seLoginWithCode failed: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<{ token: string }>
}

/**
 * Get current authenticated user details (tenantId, email, etc.)
 * Real endpoint: GET /auth/me
 */
export async function getAuthMe(jwt: string): Promise<{ tenantId: string; email: string; isAdmin: boolean }> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { 'Authorization': `Bearer ${jwt}` },
  })
  if (!res.ok) {
    throw new Error(`getAuthMe failed: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<{ tenantId: string; email: string; isAdmin: boolean }>
}

/**
 * Report a knowledge gap to the admin.
 * Real endpoint: POST /analytics/gaps, body { topic: string }, Bearer JWT auth.
 * Fails silently on error — this is a nice-to-have action.
 */
export async function reportKnowledgeGap(jwt: string, topic: string): Promise<void> {
  const res = await fetch(`${API_BASE}/analytics/gaps`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`,
    },
    body: JSON.stringify({ topic }),
  })
  if (!res.ok) {
    throw new Error(`reportKnowledgeGap failed: ${res.status} ${res.statusText}`)
  }
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
