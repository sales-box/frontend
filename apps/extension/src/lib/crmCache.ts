import type { CrmSuggestionResult } from '../screens/BriefingSheet'

export interface CrmCacheEntry {
  suggestions: CrmSuggestionResult | null
  submitted: boolean
}

const key = (messageId: string) => `copilotCrm:${messageId}`

/** Returns null if nothing has been cached for this message yet. */
export async function getCachedCrm(messageId: string): Promise<CrmCacheEntry | null> {
  const k = key(messageId)
  const raw = (await chrome.storage.local.get(k))[k] as CrmCacheEntry | undefined
  if (!raw) return null
  return raw
}

/** Write suggestions + submitted flag for a message. */
export async function setCachedCrm(
  messageId: string,
  suggestions: CrmSuggestionResult | null,
  submitted = false,
): Promise<void> {
  await chrome.storage.local.set({ [key(messageId)]: { suggestions, submitted } })
}

/**
 * Flip submitted=true in place without re-fetching the suggestions.
 * Safe to call even if nothing is cached yet — creates a submitted-only entry.
 */
export async function setCachedCrmSubmitted(messageId: string): Promise<void> {
  const k = key(messageId)
  const existing = (await chrome.storage.local.get(k))[k] as CrmCacheEntry | undefined
  await chrome.storage.local.set({ [k]: { suggestions: existing?.suggestions ?? null, submitted: true } })
}

/** Remove the CRM cache for a message (e.g. on hard refresh or after reply). */
export async function invalidateCrm(messageId: string): Promise<void> {
  await chrome.storage.local.remove(key(messageId))
}
