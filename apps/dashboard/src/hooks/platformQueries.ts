import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  platformApi,
  type StatusAction,
  type TenantFilters,
} from "../platform-client";
import { markHandled } from "../lib/platformError";

/** Marks a rejection as locally handled, then rethrows it unchanged. */
function handledLocally<T>(p: Promise<T>): Promise<T> {
  return p.catch((e: unknown) => {
    markHandled(e);
    throw e;
  });
}

// ─── Queries ─────────────────────────────────────────────────

export function usePlatformStats() {
  return useQuery({
    queryKey: ["platform", "stats"],
    queryFn: () => handledLocally(platformApi.getStats()),
  });
}

export function usePlatformTenants(page: number, filters: TenantFilters) {
  return useQuery({
    queryKey: ["platform", "tenants", page, filters.search, filters.status],
    queryFn: () => handledLocally(platformApi.listTenants(page, 20, filters)),
    // Keep the previous page on screen while the next one loads, so typing in
    // the search box does not blank the table on every keystroke.
    placeholderData: (prev) => prev,
  });
}

export function usePlatformTenant(id: string | undefined) {
  return useQuery({
    queryKey: ["platform", "tenant", id],
    queryFn: () => handledLocally(platformApi.getTenant(id!)),
    enabled: !!id,
  });
}

export function usePlatformMembers(id: string | undefined) {
  return useQuery({
    queryKey: ["platform", "tenant", id, "members"],
    queryFn: () => handledLocally(platformApi.listMembers(id!)),
    enabled: !!id,
  });
}

// ─── Mutations ───────────────────────────────────────────────

/** Every operator mutation invalidates the whole `platform` tree. */
function useInvalidatePlatform() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["platform"] });
}

export function useChangeTenantStatus() {
  const invalidate = useInvalidatePlatform();
  return useMutation({
    // Marked INSIDE the mutationFn, not via onError: query-core awaits
    // MutationCache.config.onError BEFORE options.onError (mutation.js:148 vs
    // :159), so an onError marker would run after the global toast had already
    // fired. The route reports this through friendlyError instead.
    mutationFn: ({ id, action }: { id: string; action: StatusAction }) =>
      handledLocally(platformApi.changeStatus(id, action)),
    onSuccess: invalidate,
  });
}

export function useChangeTenantTier() {
  const invalidate = useInvalidatePlatform();
  return useMutation({
    mutationFn: ({ id, tier }: { id: string; tier: number }) =>
      handledLocally(platformApi.changeTier(id, tier)),
    onSuccess: invalidate,
  });
}

// ─── Utilities ───────────────────────────────────────────────

/** Delays a fast-changing value so search does not fire a request per keystroke. */
export function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function useDeleteTenant() {
  const invalidate = useInvalidatePlatform();
  return useMutation({
    // Marked inside the mutationFn, not via onError: query-core awaits
    // MutationCache.config.onError BEFORE options.onError, so an onError
    // marker runs after the global toast has already fired.
    mutationFn: (id: string) => handledLocally(platformApi.deleteTenant(id)),
    onSuccess: invalidate,
  });
}

export function useRemoveMember() {
  const invalidate = useInvalidatePlatform();
  return useMutation({
    // Marked inside the mutationFn, not via onError: query-core awaits
    // MutationCache.config.onError BEFORE options.onError, so an onError
    // marker runs after the global toast has already fired.
    mutationFn: ({ id, email }: { id: string; email: string }) =>
      handledLocally(platformApi.removeMember(id, email)),
    onSuccess: invalidate,
  });
}
