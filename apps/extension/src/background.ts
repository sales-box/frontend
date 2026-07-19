// Background service worker — runs in extension context, NOT in the page.
//
// Why this must be a background worker (not the content script):
//   1. chrome.identity is only available in background/service-worker contexts.
//   2. fetch() from a service worker with host_permissions declared in manifest.json
//      is CORS-exempt — no need to touch CORS_ORIGINS on the backend.
//
// OAuth client_id (Chrome Extension type) is set in manifest.json → oauth2.client_id.

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://salesbox.dev'
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  // ── GET_SE_AUTH_CODE ──────────────────────────────────────────────────────
  // Obtains a Google OAuth *authorization code* via launchWebAuthFlow.
  // This is distinct from getAuthToken (access token) — the backend
  // POST /auth/se/login expects a code so it can exchange it server-side.
  if (msg.type === 'GET_SE_AUTH_CODE') {
    ;(async () => {
      try {
        const manifest = chrome.runtime.getManifest()
        const clientId = manifest.oauth2?.client_id
        if (!clientId) throw new Error('No oauth2.client_id in manifest.json')

        const redirectUrl = chrome.identity.getRedirectURL()
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
        authUrl.searchParams.set('client_id', clientId)
        authUrl.searchParams.set('redirect_uri', redirectUrl)
        authUrl.searchParams.set('response_type', 'code')
        // The backend's shared exchangeCodeForEmail() calls Gmail's users.getProfile to resolve the SE's email, and that call 403s without this scope
        authUrl.searchParams.set('scope', 'openid email profile https://www.googleapis.com/auth/gmail.readonly')
        authUrl.searchParams.set('access_type', 'offline')
        authUrl.searchParams.set('prompt', 'consent select_account')

        const responseUrl = await new Promise<string>((resolve, reject) => {
          chrome.identity.launchWebAuthFlow(
            { url: authUrl.toString(), interactive: true },
            (callbackUrl) => {
              if (chrome.runtime.lastError || !callbackUrl) {
                reject(chrome.runtime.lastError?.message || 'launchWebAuthFlow failed')
              } else {
                resolve(callbackUrl)
              }
            }
          )
        })

        const params = new URL(responseUrl).searchParams
        const code = params.get('code')
        if (!code) throw new Error('No code in OAuth callback URL')

        sendResponse({ code, redirectUri: redirectUrl })
      } catch (err) {
        console.error('[Background] GET_SE_AUTH_CODE Error:', err)
        sendResponse({ error: err instanceof Error ? err.message : String(err) })
      }
    })()
    return true // keep message channel open
  }

  // ── SE_LOGIN ──────────────────────────────────────────────────────────────
  // Route backend login through background worker to bypass CORS on the backend.
  if (msg.type === 'SE_LOGIN') {
    ;(async () => {
      let status: number | undefined
      try {
        const res = await fetch(`${API_BASE}/auth/se/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: msg.code, redirectUri: msg.redirectUri }),
        })
        status = res.status
        if (res.status === 403) {
          sendResponse({ error: 'invalid_allowlist', status: 403 })
          return
        }
        if (!res.ok) {
          sendResponse({ error: `SE_LOGIN failed: ${res.status} ${res.statusText}`, status: res.status })
          return
        }
        const data = await res.json()
        sendResponse({ ...data, status: res.status })
      } catch (err) {
        console.error('[Background] SE_LOGIN Error:', err)
        sendResponse({ error: err instanceof Error ? err.message : String(err), status })
      }
    })()
    return true
  }

  // ── GET_AUTH_ME ───────────────────────────────────────────────────────────
  if (msg.type === 'GET_AUTH_ME') {
    ;(async () => {
      let status: number | undefined
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { 'Authorization': `Bearer ${msg.jwt}` },
        })
        status = res.status
        if (!res.ok) {
          sendResponse({ error: `GET_AUTH_ME failed: ${res.status} ${res.statusText}`, status: res.status })
          return
        }
        const data = await res.json()
        sendResponse({ ...data, status: res.status })
      } catch (err) {
        console.error('[Background] GET_AUTH_ME Error:', err)
        sendResponse({ error: err instanceof Error ? err.message : String(err), status })
      }
    })()
    return true
  }

  // ── REPORT_KNOWLEDGE_GAP ──────────────────────────────────────────────────
  if (msg.type === 'REPORT_KNOWLEDGE_GAP') {
    ;(async () => {
      let status: number | undefined
      try {
        const res = await fetch(`${API_BASE}/analytics/gaps`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${msg.jwt}`,
          },
          body: JSON.stringify({ topic: msg.topic }),
        })
        status = res.status
        if (!res.ok) {
          sendResponse({ error: `REPORT_KNOWLEDGE_GAP failed: ${res.status} ${res.statusText}`, status: res.status })
          return
        }
        sendResponse({ success: true, status: res.status })
      } catch (err) {
        console.error('[Background] REPORT_KNOWLEDGE_GAP Error:', err)
        sendResponse({ error: err instanceof Error ? err.message : String(err), status })
      }
    })()
    return true
  }

  // ── PROCESS_EMAIL ──────────────────────────────────────────────────────────
  if (msg.type === 'PROCESS_EMAIL') {
    ;(async () => {
      let status: number | undefined
      try {
        const { jwt, accountEmail } = await chrome.storage.local.get(['jwt', 'accountEmail'])
        if (!jwt) {
          sendResponse({ error: 'No JWT found — user must sign in again', status: 401 })
          return
        }

        const res = await fetch(`${API_BASE}/ai/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`,
          },
          body: JSON.stringify({ messageId: msg.messageId, accountEmail }),
        })
        status = res.status
        if (!res.ok) {
          sendResponse({ error: `PROCESS_EMAIL failed: ${res.status}`, status: res.status })
          return
        }
        const data = await res.json()
        sendResponse({ ...data, status: res.status })
      } catch (err) {
        console.error('[Background] PROCESS_EMAIL Error:', err)
        sendResponse({ error: err instanceof Error ? err.message : String(err), status })
      }
    })()
    return true
  }

  // ── GET_CATEGORIZED_EMAILS ────────────────────────────────────────────────
  if (msg.type === 'GET_CATEGORIZED_EMAILS') {
    ;(async () => {
      let status: number | undefined
      try {
        const { jwt } = await chrome.storage.local.get('jwt')
        if (!jwt) {
          sendResponse({ error: 'No JWT found — user must sign in again', status: 401 })
          return
        }
        const res = await fetch(`${API_BASE}/emails/categorized?category=${encodeURIComponent(msg.category)}`, {
          headers: { Authorization: `Bearer ${jwt}` },
        })
        status = res.status
        if (!res.ok) {
          sendResponse({ error: `categorized failed: ${res.status}`, status: res.status })
          return
        }
        const data = await res.json()
        sendResponse({ emails: data, status: res.status })
      } catch (err) {
        console.error('[Background] GET_CATEGORIZED_EMAILS Error:', err)
        sendResponse({ error: err instanceof Error ? err.message : String(err), status })
      }
    })()
    return true
  }

  // ── GET_INBOX_STATS ───────────────────────────────────────────────────────
  // Reads the JWT stored after login and calls the backend directly.
  // No second OAuth flow needed — the backend already holds the user's token
  // from the initial sign-in code-exchange.
  if (msg.type !== 'GET_INBOX_STATS') return
  ;(async () => {
    let status: number | undefined
    try {
      const { jwt } = await chrome.storage.local.get('jwt')
      if (!jwt) {
        sendResponse({ error: 'No JWT found — user must sign in again', status: 401 })
        return
      }

      const res = await fetch(`${API_BASE}/emails/inbox-stats`, {
        headers: { Authorization: `Bearer ${jwt}` },
      })
      status = res.status
      if (!res.ok) {
        sendResponse({ error: `inbox-stats failed: ${res.status}`, status: res.status })
        return
      }
      const data = await res.json()

      // Translate raw backend stats shape to the InboxOverviewData contract
      let transformedIntentBreakdown: { label: string; count: number; key: string }[] | undefined = undefined
      if (data.intentBreakdown && typeof data.intentBreakdown === 'object') {
        transformedIntentBreakdown = Object.entries(data.intentBreakdown)
          .filter(([intent]) => intent && intent.trim().length > 0)
          .map(([intent, count]) => {
            const trimmedIntent = intent.trim()
            const label = trimmedIntent
              .split(/\s+/)
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ')
            const key = trimmedIntent.toLowerCase().replace(/\s+/g, '-')
            return {
              label,
              count: Number(count),
              key,
            }
          })
      }

      let transformedReviewedBreakdown: { ready: number; needsReview: number; manual: number } | undefined = undefined
      if (data.reviewedBreakdown && typeof data.reviewedBreakdown === 'object') {
        const rb = data.reviewedBreakdown as Record<string, any>
        transformedReviewedBreakdown = {
          ready: Number(rb.green ?? 0),
          needsReview: Number(rb.yellow ?? 0),
          manual: Number(rb.red ?? 0),
        }
      }

      const transformedData = {
        ...data,
        intentBreakdown: transformedIntentBreakdown,
        reviewedBreakdown: transformedReviewedBreakdown,
      }

      sendResponse({ ...transformedData, status: res.status })
    } catch (err) {
      console.error('[Background] GET_INBOX_STATS Error:', err)
      sendResponse({ error: err instanceof Error ? err.message : String(err), status })
    }
  })()
  return true
})
