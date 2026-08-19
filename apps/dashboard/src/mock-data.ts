const DAY = 86_400_000;
const anchor = new Date();

function iso(daysAgo: number, hour = 10, minute = 0) {
  const value = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - daysAgo, hour, minute);
  return value.toISOString();
}

function shortDate(daysAgo: number) {
  const value = new Date(anchor.getTime() - daysAgo * DAY);
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const clients = [
  { id: "cl-aurora", name: "Maya Chen", email: "maya.chen@aurorapay.com", company: "Aurora Pay", status: "Active", crmId: "hs-10482", createdAt: iso(118), updatedAt: iso(0, 9, 42) },
  { id: "cl-northstar", name: "Ethan Williams", email: "ethan@northstarlabs.io", company: "Northstar Labs", status: "Active", crmId: "hs-10731", createdAt: iso(96), updatedAt: iso(0, 9, 18) },
  { id: "cl-meridian", name: "Sofia Ramirez", email: "sofia@meridianhealth.co", company: "Meridian Health", status: "At risk", crmId: "hs-10904", createdAt: iso(84), updatedAt: iso(0, 8, 51) },
  { id: "cl-verde", name: "Noah Thompson", email: "noah@verdelogistics.com", company: "Verde Logistics", status: "Active", crmId: "hs-11028", createdAt: iso(73), updatedAt: iso(1, 16, 5) },
  { id: "cl-cobalt", name: "Amara Okafor", email: "amara@cobaltfinance.com", company: "Cobalt Finance", status: "New", crmId: "hs-11392", createdAt: iso(8), updatedAt: iso(1, 14, 32) },
  { id: "cl-summit", name: "Liam Patel", email: "liam@summitworks.ai", company: "Summit Works", status: "Active", crmId: "hs-11507", createdAt: iso(55), updatedAt: iso(1, 11, 47) },
  { id: "cl-harbor", name: "Olivia Brooks", email: "olivia@harborcloud.dev", company: "Harbor Cloud", status: "Active", crmId: "hs-11866", createdAt: iso(41), updatedAt: iso(2, 15, 20) },
  { id: "cl-lumina", name: "Daniel Kim", email: "daniel@luminaenergy.com", company: "Lumina Energy", status: "New", crmId: null, createdAt: iso(3), updatedAt: iso(2, 10, 15) },
];

const interactions: Record<string, Array<Record<string, unknown>>> = {
  "cl-aurora": [
    { id: "ix-101", type: "email", subject: "Enterprise rollout timeline", aiSummary: "Aurora Pay is preparing a 60-seat rollout. Security review is complete, and procurement needs final pricing plus a phased implementation plan by Friday.", date: shortDate(0), classification: "Pricing inquiry", productConfidence: 0.96, clientHistoryConfidence: 0.92, recommendation: "Send the approved enterprise pricing sheet and propose a kickoff next Tuesday." },
    { id: "ix-102", type: "email", subject: "Security questionnaire follow-up", aiSummary: "The security team requested clarification on data retention and regional hosting.", date: shortDate(6), classification: "Security review", productConfidence: 0.91, clientHistoryConfidence: 0.88, recommendation: "Share the security overview and DPA." },
    { id: "ix-103", type: "email", subject: "Pilot results and next steps", aiSummary: "The pilot exceeded the target response-rate improvement and has executive sponsorship.", date: shortDate(13), classification: "Expansion", productConfidence: 0.94, clientHistoryConfidence: 0.9, recommendation: "Move the opportunity to commercial review." },
  ],
  "cl-meridian": [
    { id: "ix-201", type: "email", subject: "SSO configuration blocked", aiSummary: "Meridian Health cannot complete SAML setup because their identity provider requires an attribute mapping not covered in the current guide.", date: shortDate(0), classification: "Technical support", productConfidence: 0.67, clientHistoryConfidence: 0.84, recommendation: "Escalate to solutions engineering and schedule a configuration session." },
    { id: "ix-202", type: "email", subject: "Renewal readiness check", aiSummary: "The renewal remains at risk until the SSO blocker is resolved.", date: shortDate(9), classification: "Renewal", productConfidence: 0.89, clientHistoryConfidence: 0.93, recommendation: "Resolve the technical blocker before discussing renewal terms." },
  ],
};

function clientRecord(id: string) {
  const client = clients.find(item => item.id === id) ?? clients[0];
  return { ...client, interactions: interactions[client.id] ?? [
    { id: `ix-${client.id}`, type: "email", subject: "Product evaluation follow-up", aiSummary: `${client.company} is actively evaluating the Growth plan and has requested implementation guidance.`, date: shortDate(2), classification: "Product inquiry", productConfidence: 0.9, clientHistoryConfidence: 0.82, recommendation: "Share the implementation checklist and book a technical review." },
  ] };
}

const documents = [
  { id: "doc-product", filename: "Product_Platform_Overview_2026.pdf", fileType: "pdf", status: "completed", chunkCount: 86, uploadDate: iso(2, 11, 20), processingError: null, isLowConfidence: false, qualityReason: null, qualityScore: 94, qualityReport: { score: 94, passed: ["coverage", "clarity", "freshness"], failed: [], ruleKeys: [], redundancyRatio: 0.04, concisenessScore: 0.91, duplicateChunkPairs: 1, evaluatedAt: iso(2, 11, 24) } },
  { id: "doc-pricing", filename: "Enterprise_Pricing_and_Packaging.xlsx", fileType: "xlsx", status: "completed", chunkCount: 43, uploadDate: iso(4, 14, 5), processingError: null, isLowConfidence: false, qualityReason: null, qualityScore: 97, qualityReport: { score: 97, passed: ["coverage", "clarity", "freshness"], failed: [], ruleKeys: [], redundancyRatio: 0.02, concisenessScore: 0.95, duplicateChunkPairs: 0, evaluatedAt: iso(4, 14, 9) } },
  { id: "doc-security", filename: "Security_and_Compliance_FAQ.pdf", fileType: "pdf", status: "completed", chunkCount: 64, uploadDate: iso(7, 9, 45), processingError: null, isLowConfidence: false, qualityReason: null, qualityScore: 89, qualityReport: { score: 89, passed: ["coverage", "clarity"], failed: [{ category: "freshness", asks: "Confirm the latest SOC 2 report date." }], ruleKeys: ["freshness"], redundancyRatio: 0.06, concisenessScore: 0.88, duplicateChunkPairs: 2, evaluatedAt: iso(7, 9, 50) } },
  { id: "doc-implementation", filename: "Implementation_Playbook.docx", fileType: "docx", status: "completed", chunkCount: 112, uploadDate: iso(12, 15, 30), processingError: null, isLowConfidence: false, qualityReason: null, qualityScore: 92, qualityReport: { score: 92, passed: ["coverage", "clarity"], failed: [], ruleKeys: [], redundancyRatio: 0.05, concisenessScore: 0.9, duplicateChunkPairs: 1, evaluatedAt: iso(12, 15, 34) } },
  { id: "doc-sso", filename: "Legacy_SSO_Setup_Guide.pdf", fileType: "pdf", status: "completed", chunkCount: 18, uploadDate: iso(21, 8, 10), processingError: null, isLowConfidence: true, qualityReason: "Several scanned pages contain little extractable text.", qualityScore: 46, qualityReport: { score: 46, passed: ["coverage"], failed: [{ category: "readability", asks: "Replace scanned pages with selectable text." }], ruleKeys: ["readability"], redundancyRatio: 0.19, concisenessScore: 0.62, duplicateChunkPairs: 4, evaluatedAt: iso(21, 8, 15) } },
];

const team = [
  { email: "alex.morgan@northpeak.io", status: "verified", grantedAt: iso(104), verifiedAt: iso(103), lastLoginAt: iso(0, 9, 12), emailsReceived: 186, repliesSent: 142, replyRate: 0.763 },
  { email: "priya.shah@northpeak.io", status: "verified", grantedAt: iso(91), verifiedAt: iso(91), lastLoginAt: iso(0, 8, 44), emailsReceived: 164, repliesSent: 129, replyRate: 0.787 },
  { email: "marcus.lee@northpeak.io", status: "verified", grantedAt: iso(68), verifiedAt: iso(67), lastLoginAt: iso(1, 16, 23), emailsReceived: 151, repliesSent: 117, replyRate: 0.775 },
  { email: "elena.garcia@northpeak.io", status: "verified", grantedAt: iso(34), verifiedAt: iso(33), lastLoginAt: iso(1, 14, 8), emailsReceived: 108, repliesSent: 81, replyRate: 0.75 },
  { email: "jordan.bell@northpeak.io", status: "granted", grantedAt: iso(2), verifiedAt: null, lastLoginAt: null, emailsReceived: 0, repliesSent: 0, replyRate: 0 },
] as const;

const activity = [
  { id: "act-1", time: iso(0, 9, 42), client: "Maya Chen", company: "Aurora Pay", classification: "Pricing inquiry", confidence: 0.96, action: "Sent as-is" },
  { id: "act-2", time: iso(0, 9, 18), client: "Ethan Williams", company: "Northstar Labs", classification: "Demo request", confidence: 0.93, action: "Edited" },
  { id: "act-3", time: iso(0, 8, 51), client: "Sofia Ramirez", company: "Meridian Health", classification: "Technical support", confidence: 0.67, action: "Escalated" },
  { id: "act-4", time: iso(0, 8, 37), client: "Noah Thompson", company: "Verde Logistics", classification: "Product inquiry", confidence: 0.89, action: "Sent as-is" },
  { id: "act-5", time: iso(0, 8, 14), client: "Amara Okafor", company: "Cobalt Finance", classification: "Security review", confidence: 0.84, action: "Edited" },
  { id: "act-6", time: iso(0, 7, 56), client: "Liam Patel", company: "Summit Works", classification: "Expansion", confidence: 0.94, action: "Sent as-is" },
  { id: "act-7", time: iso(0, 7, 31), client: "Olivia Brooks", company: "Harbor Cloud", classification: "Renewal", confidence: 0.88, action: "Edited" },
  { id: "act-8", time: iso(0, 7, 9), client: "Daniel Kim", company: "Lumina Energy", classification: "Product inquiry", confidence: 0.91, action: "Sent as-is" },
];

const pagination = (total: number, page: number, limit: number) => ({
  total, lastPage: Math.max(1, Math.ceil(total / limit)), currentPage: page, limit,
  prev: page > 1 ? page - 1 : null,
  next: page * limit < total ? page + 1 : null,
});

export const SCREENSHOT_TOKEN = "header.eyJ0ZW5hbnRJZCI6ImRlbW8tdGVuYW50IiwgImVtYWlsIjoiamFtaWUudGF5bG9yQG5vcnRocGVhay5pbyIsICJpc0FkbWluIjp0cnVlfQ.signature";

export function getScreenshotData(rawUrl: string, init?: RequestInit): unknown {
  const url = new URL(rawUrl, window.location.origin);
  const path = url.pathname;
  const method = init?.method ?? "GET";

  if (path === "/auth/me") return { tenantId: "demo-tenant", email: "jamie.taylor@northpeak.io", isAdmin: true };
  if (path === "/auth/admin/login") return { token: SCREENSHOT_TOKEN };
  if (path.startsWith("/tenants/signup") || path.startsWith("/tenants/resend-verification")) return { message: "Success" };
  if (path.endsWith("/crm/status")) return { connected: true, status: "connected", provider: "HubSpot", lastSync: iso(0, 8, 30) };
  if (path.endsWith("/crm/mcp-status")) return { connected: false };
  if (path.endsWith("/allowlist")) return team.map((member, index) => ({ id: `se-${index + 1}`, tenantId: "demo-tenant", email: member.email, status: member.status, grantedAt: member.grantedAt, verifiedAt: member.verifiedAt, revokedAt: null }));
  if (path.startsWith("/tenants/")) return { id: "demo-tenant", companyName: "Northpeak Systems", tier: 2, status: "active" };

  if (path === "/knowledge-base/documents" && method === "DELETE") return { deleted: documents.length };
  if (path === "/knowledge-base/documents") return { data: documents, meta: pagination(documents.length, 1, 50) };
  if (path === "/knowledge-base/upload") return { filename: "Uploaded_document.pdf", chunksCreated: 38, status: "completed", isLowConfidence: false, qualityReason: null };
  if (path.startsWith("/knowledge-base/documents/")) return undefined;

  if (/^\/clients\/[^/]+\/interactions$/.test(path)) {
    const id = decodeURIComponent(path.split("/")[2]);
    const data = clientRecord(id).interactions;
    return { data, meta: pagination(data.length, 1, 20) };
  }
  if (/^\/clients\/[^/]+$/.test(path)) return clientRecord(decodeURIComponent(path.split("/")[2]));
  if (path === "/clients") {
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 10);
    const search = (url.searchParams.get("search") ?? "").toLowerCase();
    const filtered = clients.filter(client => `${client.name} ${client.company} ${client.email}`.toLowerCase().includes(search));
    return { data: filtered.slice((page - 1) * limit, page * limit), meta: pagination(filtered.length, page, limit) };
  }

  if (path === "/analytics/summary") return {
    totalEmailsProcessed: 1247,
    byClassification: { "Product inquiry": 386, "Pricing inquiry": 271, "Demo request": 219, "Technical support": 174, Renewal: 112, Other: 85 },
    averageConfidence: 0.91,
    lowConfidenceCount: 38,
    momChangePct: 18,
    dailyCounts: Array.from({ length: 14 }, (_, index) => ({ date: shortDate(13 - index), emails: [31, 38, 35, 47, 42, 51, 49, 58, 54, 63, 59, 68, 64, 72][index] })),
    replies: { threads: 834 },
    aiReviewed: { count: 1096, escalated: 49 },
  };
  if (path === "/analytics/gaps/alerts") return [
    { id: "gap-sso", topic: "SAML SSO attribute mapping", occurrences: 14, resolved: false, tenantId: "demo-tenant", createdAt: iso(11), updatedAt: iso(0), evidence: [{ reportedAt: iso(0), subject: "SSO configuration blocked", summary: "Customer identity provider requires a custom attribute mapping.", classification: "Technical support", emailDate: iso(0), sender: { name: "Sofia Ramirez", email: "sofia@meridianhealth.co", company: "Meridian Health" } }] },
    { id: "gap-retention", topic: "Regional data retention policy", occurrences: 9, resolved: false, tenantId: "demo-tenant", createdAt: iso(8), updatedAt: iso(1), evidence: [{ reportedAt: iso(1), subject: "EU retention requirements", summary: "Prospect requested retention periods by hosting region.", classification: "Security review", emailDate: iso(1), sender: { name: "Amara Okafor", email: "amara@cobaltfinance.com", company: "Cobalt Finance" } }] },
    { id: "gap-api", topic: "Bulk export API limits", occurrences: 5, resolved: true, tenantId: "demo-tenant", createdAt: iso(18), updatedAt: iso(3), evidence: [] },
  ];
  if (/^\/analytics\/gaps\/[^/]+\/resolve$/.test(path)) return { id: path.split("/")[3], resolved: true };
  if (path === "/analytics/activity") {
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    return { data: activity.slice((page - 1) * limit, page * limit), meta: pagination(activity.length, page, limit) };
  }
  if (path === "/analytics/team") return team;

  if (path === "/payments/create-payment-intent") return { id: "pi_demo", client_secret: "pi_demo_secret", amount: 14900, status: "requires_payment_method" };
  if (method !== "GET") return undefined;
  return {};
}
