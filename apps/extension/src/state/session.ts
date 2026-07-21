import type { InboxOverviewData } from '../screens/InboxOverviewScreen'

export const StorageKeys = {
  jwt: 'jwt',
  tenantId: 'tenantId',
  accountEmail: 'accountEmail',
  cachedInboxStats: 'cachedInboxStats',
} as const

export interface Session {
  jwt: string | null
  tenantId: string | null
  accountEmail: string | null
  cachedInboxStats: InboxOverviewData | null
}

const ALL_KEYS: string[] = Object.values(StorageKeys)

export async function getSession(): Promise<Session> {
  const raw = await chrome.storage.local.get(ALL_KEYS)
  return {
    jwt: raw[StorageKeys.jwt] ?? null,
    tenantId: raw[StorageKeys.tenantId] ?? null,
    accountEmail: raw[StorageKeys.accountEmail] ?? null,
    cachedInboxStats: raw[StorageKeys.cachedInboxStats] ?? null,
  }
}

export async function setSession(update: Partial<Session>): Promise<void> {
  const payload: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(update)) {
    if (v !== undefined) payload[k] = v
  }
  if (Object.keys(payload).length > 0) {
    await chrome.storage.local.set(payload)
  }
}

export async function clearSession(): Promise<void> {
  await chrome.storage.local.remove(ALL_KEYS)
}
