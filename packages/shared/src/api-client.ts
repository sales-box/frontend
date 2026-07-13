// src/api-client.ts
// Params prefixed with _ are intentionally unused — mock stubs for Sprint 3.
// They will be replaced with real fetch() calls when the backend is ready.

// ── SE / Extension (matches CONTRACTS.md Role 2) ─────────────────
// ⚠️ MOCK — POST /auth/se/login does not exist on the backend yet
export async function seLoginWithCode(_code: string): Promise<{ token: string } | { error: "invalid_allowlist" }> {
  return { token: "mock-se-jwt-token" };
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
