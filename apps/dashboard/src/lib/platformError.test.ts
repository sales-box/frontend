import { describe, it, expect, vi } from "vitest";
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { PlatformApiError, markHandled, isHandled } from "./platformError";

/** Marks a rejection as locally handled, then rethrows it unchanged. */
function handledLocally<T>(p: Promise<T>): Promise<T> {
  return p.catch((e: unknown) => {
    markHandled(e);
    throw e;
  });
}

/**
 * Builds the same client wiring as main.tsx: global cache handlers that toast
 * the raw message unless the error was already reported locally.
 */
function makeClient() {
  const toast = vi.fn<(m: string) => void>();
  const onError = (error: unknown) => {
    if (isHandled(error)) return;
    toast(error instanceof Error ? error.message : "Something went wrong");
  };
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
  });
  return { client, toast };
}

const RAW = '{"stack":"at Object.<anonymous>"}';

describe("global toast suppression — real react-query wiring", () => {
  it("toasts the raw message when an error is NOT marked", async () => {
    const { client, toast } = makeClient();
    await client
      .fetchQuery({
        queryKey: ["unmarked"],
        queryFn: () => Promise.reject(new PlatformApiError(500, RAW)),
      })
      .catch(() => {});
    expect(toast).toHaveBeenCalledWith(RAW);
  });

  it("stays silent for a query that marks its own error", async () => {
    const { client, toast } = makeClient();
    await client
      .fetchQuery({
        queryKey: ["marked"],
        queryFn: () =>
          handledLocally(Promise.reject(new PlatformApiError(500, RAW))),
      })
      .catch(() => {});
    expect(toast).not.toHaveBeenCalled();
  });

  /**
   * Regression guard. query-core awaits MutationCache.config.onError BEFORE
   * options.onError, so marking via `onError: markHandled` runs too late and
   * the raw toast fires anyway. Marking must happen inside the mutationFn.
   */
  it("stays silent for a mutation that marks inside its mutationFn", async () => {
    const { client, toast } = makeClient();
    await client
      .getMutationCache()
      .build(client, {
        mutationFn: () =>
          handledLocally(Promise.reject(new PlatformApiError(500, RAW))),
      })
      .execute(undefined)
      .catch(() => {});
    expect(toast).not.toHaveBeenCalled();
  });

  it("DOES toast when a mutation marks via onError (the broken form)", async () => {
    const { client, toast } = makeClient();
    await client
      .getMutationCache()
      .build(client, {
        mutationFn: () => Promise.reject(new PlatformApiError(500, RAW)),
        onError: markHandled,
      })
      .execute(undefined)
      .catch(() => {});
    // Proves the ordering hazard is real, not theoretical.
    expect(toast).toHaveBeenCalledWith(RAW);
  });
});
