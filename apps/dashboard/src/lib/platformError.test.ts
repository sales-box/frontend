import { describe, it, expect, vi } from "vitest";
import { PlatformApiError, markHandled, isHandled } from "./platformError";

/**
 * Reproduces the double-toast defect: main.tsx's global cache handler toasts
 * error.message verbatim unless the error is marked handled.
 */
function globalHandlerSimulation(error: unknown, toast: (m: string) => void) {
  if (isHandled(error)) return;
  toast(error instanceof Error ? error.message : "Something went wrong");
}

describe("global error handler suppression", () => {
  it("toasts a raw message for an UNMARKED error (the old behaviour)", () => {
    const toast = vi.fn();
    globalHandlerSimulation(new PlatformApiError(500, '{"stack":"leak"}'), toast);
    expect(toast).toHaveBeenCalledWith('{"stack":"leak"}');
  });

  it("stays silent for a MARKED error, leaving one friendly toast", () => {
    const toast = vi.fn();
    const e = new PlatformApiError(500, '{"stack":"leak"}');
    markHandled(e);
    globalHandlerSimulation(e, toast);
    expect(toast).not.toHaveBeenCalled();
  });
});
