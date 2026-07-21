import { useCallback } from 'react'

export interface GmailContextHooks {
  /** Poll for the connected Google account. 15 × 300ms = 4.5s max. */
  resolveAccount: () => Promise<string | null>
  /** Poll for the open thread's message id. 15 × 200ms = 3.0s max. */
  resolveMessageId: () => Promise<string | null>
}

export function useGmailContext(
  getCurrentAccount: () => string | null,
  getCurrentMessageId: () => string | null,
): GmailContextHooks {
  const resolveAccount = useCallback(async (): Promise<string | null> => {
    for (let i = 0; i < 15; i++) {
      const acc = getCurrentAccount()
      if (acc) return acc
      await new Promise((r) => setTimeout(r, 300))
    }
    return null
  }, [getCurrentAccount])

  const resolveMessageId = useCallback(async (): Promise<string | null> => {
    for (let i = 0; i < 15; i++) {
      const id = getCurrentMessageId()
      if (id) return id
      await new Promise((r) => setTimeout(r, 200))
    }
    return null
  }, [getCurrentMessageId])

  return { resolveAccount, resolveMessageId }
}
