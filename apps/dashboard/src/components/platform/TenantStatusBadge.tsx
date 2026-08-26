import { Badge } from "../Badge";
import { statusLabel, statusVariant } from "../../lib/platformFormat";
import type { TenantStatus } from "../../platform-client";

/** A tenant lifecycle state, never shown as the raw lowercase enum. */
export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  return <Badge variant={statusVariant(status)}>{statusLabel(status)}</Badge>;
}
