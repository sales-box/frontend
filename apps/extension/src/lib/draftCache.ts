import type { PipelineResponse } from './derivePipelineScreen'

const key = (messageId: string) => `copilotDraft:${messageId}`

/** Returns null if the cached value is a replied-state (invariant: never serve stale replied). */
export async function getCachedDraft(messageId: string): Promise<PipelineResponse | null> {
  const k = key(messageId)
  const raw = (await chrome.storage.local.get(k))[k] as PipelineResponse | undefined
  if (!raw) return null
  if (raw.alreadyReplied) return null
  return raw
}

/** No-op if the response is a replied-state (invariant: never cache replied). */
export async function setCachedDraft(messageId: string, response: PipelineResponse): Promise<void> {
  if (response.alreadyReplied) return
  await chrome.storage.local.set({ [key(messageId)]: response })
}

export async function invalidateDraft(messageId: string): Promise<void> {
  await chrome.storage.local.remove(key(messageId))
}
