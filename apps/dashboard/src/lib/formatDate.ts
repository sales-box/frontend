/**
 * A timestamp as a person reads it.
 *
 * The API returns raw ISO strings, and screens that printed them verbatim showed
 * "2026-08-28T09:21:33.421Z" in a field the rest of the page treats as prose.
 *
 * An unparseable value is returned untouched rather than rendered as "Invalid
 * Date" — whatever the server sent is more useful to a reader than that.
 */
export function formatDate(raw: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
