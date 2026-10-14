import { vi, beforeEach } from 'vitest'

const storageData = new Map<string, unknown>()

// Reset between tests
beforeEach(() => {
  storageData.clear()
  vi.clearAllMocks()
})

// Minimal chrome global — extend per-test with vi.mocked(...)
;(globalThis as any).chrome = {
  runtime: {
    sendMessage: vi.fn(),
    getURL: vi.fn((p: string) => p),
    onMessage: { addListener: vi.fn() },
  },
  storage: {
    local: {
      get: vi.fn(async (keys: string | string[]) => {
        const arr = Array.isArray(keys) ? keys : [keys]
        return Object.fromEntries(arr.map(k => [k, storageData.get(k)]))
      }),
      set: vi.fn(async (obj: Record<string, unknown>) => {
        for (const [k, v] of Object.entries(obj)) storageData.set(k, v)
      }),
      remove: vi.fn(async (keys: string | string[]) => {
        const arr = Array.isArray(keys) ? keys : [keys]
        arr.forEach(k => storageData.delete(k))
      }),
    },
  },
  tabs: { create: vi.fn() },
}
