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
