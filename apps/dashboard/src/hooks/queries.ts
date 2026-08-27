import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  tenants, clients, knowledgeBase, allowlist, crm, analytics,
} from "../api-client";

// ─── Tenant ──────────────────────────────────────────────────

export function useTenant() {
  return useQuery({
    queryKey: ["tenant"],
    queryFn: () => tenants.get(),
  });
}

// ─── Clients ─────────────────────────────────────────────────

export function useClients(page: number, limit: number, search: string) {
  return useQuery({
    queryKey: ["clients", page, limit, search],
    queryFn: () => clients.list(page, limit, search),
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ["client", id],
    queryFn: () => clients.get(id!),
    enabled: !!id,
  });
}

// ─── Knowledge Base ──────────────────────────────────────────

export function useDocuments(page = 1, limit = 50) {
  return useQuery({
    queryKey: ["kb", page, limit],
    queryFn: () => knowledgeBase.list(page, limit),
    // Quality is scored by a background job after upload. Poll every 3s while
    // any completed document is still awaiting its score, then stop — so the
    // badge appears on its own without a manual refresh.
    refetchInterval: (query) => {
      const pending = query.state.data?.data?.some(
        (d) => d.status === "completed" && d.qualityScore == null,
      );
      return pending ? 3000 : false;
    },
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => knowledgeBase.upload(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kb"] }),
  });
}

/**
 * What the quality score measures. Static per deployment — the rubric only
 * changes when the backend is redeployed — so it is cached hard rather than
 * refetched on every visit to the screen.
 */
export function useQualityCriteria() {
  return useQuery({
    queryKey: ["kb-quality-criteria"],
    queryFn: () => knowledgeBase.criteria(),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => knowledgeBase.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kb"] }),
  });
}

export function useDeleteAllDocuments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => knowledgeBase.deleteAll(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kb"] }),
  });
}

// ─── Team / Allowlist ────────────────────────────────────────

export function useAllowlist() {
  return useQuery({
    queryKey: ["allowlist"],
    queryFn: () => allowlist.list(),
  });
}

export function useGrantAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => allowlist.grant(email),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allowlist"] });
      qc.invalidateQueries({ queryKey: ["team-stats"] });
    },
  });
}

/**
 * Bulk grant. Unlike useGrantAccess this resolves with a per-row report rather
 * than throwing on partial failure — a paste where three of fifty addresses are
 * bad is a normal outcome to display, not an error to swallow.
 */
export function useGrantAccessBulk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (emails: string[]) => allowlist.grantBulk(emails),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allowlist"] });
      qc.invalidateQueries({ queryKey: ["team-stats"] });
    },
  });
}

export function useRevokeAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => allowlist.revoke(email),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allowlist"] });
      qc.invalidateQueries({ queryKey: ["team-stats"] });
    },
  });
}

export function useOffboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => allowlist.offboard(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allowlist"] });
      qc.invalidateQueries({ queryKey: ["team-stats"] });
      qc.invalidateQueries({ queryKey: ["tenant"] });
    },
  });
}

// ─── CRM ─────────────────────────────────────────────────────

export function useCrmStatus() {
  return useQuery({
    queryKey: ["crm-status"],
    queryFn: () => crm.status(),
  });
}

export function useConnectCrm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ provider, apiKey }: { provider: string; apiKey: string }) =>
      crm.connect(provider, apiKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-status"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useDisconnectCrm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => crm.disconnect(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-status"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useMcpStatus() {
  return useQuery({
    queryKey: ["mcp-status"],
    queryFn: () => crm.mcpStatus(),
  });
}

export function useConnectZohoMcp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mcpServerUrl: string) => crm.connectMcp(mcpServerUrl),
    // Zoho imports contacts now, so the client list and the credential status
    // are both stale after this — not just the agent connection.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mcp-status"] });
      qc.invalidateQueries({ queryKey: ["crm-status"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useDisconnectZohoMcp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => crm.disconnectMcp(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mcp-status"] });
      qc.invalidateQueries({ queryKey: ["crm-status"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

// ─── Analytics ───────────────────────────────────────────────

export function useAnalyticsSummary(days = 30) {
  return useQuery({
    queryKey: ["analytics-summary", days],
    queryFn: () => analytics.summary(days),
  });
}

export function useTeamStats() {
  return useQuery({
    queryKey: ["team-stats"],
    queryFn: () => analytics.team(),
  });
}

export function useKnowledgeGaps(threshold = 3, includeResolved = false) {
  return useQuery({
    // includeResolved is part of the key: the Analytics page asks for resolved
    // rows too so it can show "N of M resolved", and that must not share a
    // cache entry with a caller that only wants outstanding gaps.
    queryKey: ["gaps", threshold, includeResolved],
    queryFn: () => analytics.gaps(threshold, includeResolved),
  });
}

export function useResolveGap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => analytics.resolveGap(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gaps"] }),
  });
}

export function useActivityFeed(page: number, limit: number, date?: string) {
  return useQuery({
    queryKey: ["activity-feed", page, limit, date],
    queryFn: () => analytics.getActivity(page, limit, date),
  });
}

export function useEscalations(page = 1, limit = 50, status?: string, date?: string) {
  return useQuery({
    queryKey: ["escalations", page, limit, status, date],
    queryFn: () => analytics.getEscalations(page, limit, status, date),
  });
}

export function useResolveEscalation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status?: "reviewed" | "dismissed" }) =>
      analytics.resolveEscalation(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["escalations"] }),
  });
}
