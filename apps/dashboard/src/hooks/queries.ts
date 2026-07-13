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
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => knowledgeBase.upload(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kb"] }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => knowledgeBase.delete(id),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allowlist"] }),
  });
}

export function useRevokeAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => allowlist.revoke(email),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allowlist"] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-status"] }),
  });
}

// ─── Analytics ───────────────────────────────────────────────

export function useAnalyticsSummary(days = 30) {
  return useQuery({
    queryKey: ["analytics-summary", days],
    queryFn: () => analytics.summary(days),
  });
}

export function useKnowledgeGaps(threshold = 3) {
  return useQuery({
    queryKey: ["gaps", threshold],
    queryFn: () => analytics.gaps(threshold),
  });
}

export function useResolveGap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => analytics.resolveGap(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gaps"] }),
  });
}
