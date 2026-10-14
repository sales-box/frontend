/**
 * A failed platform API call, carrying the HTTP status so callers can decide
 * what to tell the operator.
 *
 * Deliberately in its own module: `platform-client.ts` reads `sessionStorage`
 * at import time, so anything importing it needs a DOM. This has no imports at
 * all and is safe from a plain Node test.
 *
 * `status` is assigned explicitly rather than declared as a constructor
 * parameter property — this project builds with `erasableSyntaxOnly`, which
 * forbids the parameter-property shorthand because it emits runtime code.
 */
export class PlatformApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "PlatformApiError";
  }
}

const HANDLED = Symbol.for("salesbox.errorHandledLocally");

/**
 * Marks an error as already reported to the user by the code that caught it.
 *
 * `main.tsx` installs global QueryCache/MutationCache onError handlers that
 * toast `error.message` verbatim. The operator console reports its own errors
 * through `friendlyError`, so without this marker every failure toasts twice —
 * once readable, once raw.
 */
export function markHandled(e: unknown): void {
  if (typeof e === "object" && e !== null) {
    (e as Record<symbol, boolean>)[HANDLED] = true;
  }
}

export function isHandled(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    (e as Record<symbol, boolean>)[HANDLED] === true
  );
}
