/**
 * Resolves a Vite asset import to a URL usable inside the extension.
 *
 * Vite inlines assets smaller than `assetsInlineLimit` (4096 bytes by
 * default) as `data:` URIs, and emits larger ones as file paths. The two need
 * opposite handling:
 *
 *   - file path  → must be run through chrome.runtime.getURL(), since the
 *     content script's base URL is mail.google.com, not the extension.
 *   - data: URI  → already self-contained. Passing it to getURL() yields
 *     `chrome-extension://<id>/data:image/svg+xml,...`, which 404s.
 *
 * The mascot PNGs (>100KB) take the first path; the silhouette SVG (~1.4KB)
 * takes the second. Callers should not have to know which.
 */
export function assetUrl(imported: string): string {
  if (imported.startsWith('data:') || imported.startsWith('blob:')) return imported
  return chrome.runtime.getURL(imported)
}
