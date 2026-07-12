// Background service worker — runs in extension context, NOT in the page.
//
// Why this must be a background worker (not the content script):
//   1. chrome.identity is only available in background/service-worker contexts.
//   2. fetch() from a service worker with host_permissions declared in manifest.json
//      is CORS-exempt — no need to touch CORS_ORIGINS on the backend.
//
// OAuth client_id (Chrome Extension type) is set in manifest.json → oauth2.client_id.

const API_BASE = 'https://salesbox.dev' // switch to http://localhost:3000 for local dev

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== 'GET_INBOX_STATS') return

  ;(async () => {
    try {
      console.log('[Background] Starting GET_INBOX_STATS flow...')
      // 1) Real Google access token via chrome.identity — not available in content scripts,
      // which is why this whole flow lives in the background worker.
      const token = await new Promise<string>((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (t) => {
          if (chrome.runtime.lastError || !t) {
            console.error('[Background] getAuthToken failed:', chrome.runtime.lastError)
            reject(chrome.runtime.lastError?.message || 'no_token')
          } else {
            console.log('[Background] getAuthToken succeeded.')
            resolve(t)
          }
        })
      })

      // 2) Resolve the SE's own email from the token
      console.log('[Background] Fetching userinfo...')
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!userinfoRes.ok) throw new Error(`userinfo failed: ${userinfoRes.status}`)
      const { email } = await userinfoRes.json()
      console.log('[Background] User email:', email)

      // 3) Real backend call — GET /emails/thread-history is a real, working endpoint
      // (verified against src/modules/emails/*). Passing the SE's own email as the query
      // returns effectively their full inbox — that's intentional, not a workaround.
      console.log('[Background] Fetching thread-history from backend...')
      const threadsRes = await fetch(
        `${API_BASE}/emails/thread-history?email=${encodeURIComponent(email)}`,
        { headers: { 'x-gmail-token': token } },
      )
      if (!threadsRes.ok) throw new Error(`thread-history failed: ${threadsRes.status}`)
      const threads: unknown[] = await threadsRes.json()
      console.log('[Background] thread-history succeeded. Found', threads.length, 'threads.')

      sendResponse({
        email,
        totalEmails: threads.length,
        syncedAt: new Date().toISOString(),
      })
    } catch (err) {
      console.error('[Background] GET_INBOX_STATS Error:', err)
      sendResponse({ error: err instanceof Error ? err.message : String(err) })
    }
  })()

  return true // keep the message channel open for the async response
})
