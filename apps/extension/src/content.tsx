import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import styles from './index.css?inline'   // Vite ?inline — bundles CSS as a string

/**
 * content.tsx — Gmail injection with Shadow DOM isolation.
 *
 * Shadow DOM ensures:
 * 1. Gmail's CSS cannot bleed into the panel (no style conflicts)
 * 2. The panel's CSS cannot bleed out into Gmail
 * 3. Fonts are loaded into the shadow root via a <style> tag referencing
 *    chrome-extension:// URLs (declared in manifest web_accessible_resources)
 *
 * Gmail layout push:
 * - The panel is position:fixed so it sits on top of the viewport.
 * - syncGmailLayout() applies a matching margin-right to <html> so Gmail's
 *   own content reflows into the narrower available width.
 * - A window 'resize' event is dispatched after every margin change so
 *   Gmail's JS layout engine re-measures and reflows immediately.
 * - All cross-boundary DOM writes (touching real Gmail DOM) are isolated
 *   inside syncGmailLayout() — nowhere else in this file reaches outside
 *   the shadow root.
 */

const CONTAINER_ID = 'inbox-copilot-root'

// Gmail's top toolbar is always ~64 px. We offset the panel below it so it
// doesn't cover the avatar / settings icons in the top-right corner.
const GMAIL_HEADER_HEIGHT = 64

// ── Gmail layout push ────────────────────────────────────────────────────────

/**
 * Reads the panel's open width from the CSS variable defined in index.css.
 *
 * We query the *shadow root's* style element rather than the host element,
 * because @theme tokens are scoped to the shadow DOM and may not be visible
 * on document.documentElement. We fall back to a safe literal only if the
 * variable is somehow absent (e.g., during unit tests without JSDOM styles).
 *
 * ⚠ BOUNDARY CROSSING — this function reads from inside the shadow root but
 * writes to the real Gmail DOM (document.documentElement). Keep all Gmail DOM
 * mutations inside syncGmailLayout() so the crossing is obvious and auditable.
 */
function getPanelOpenWidth(shadowRoot: ShadowRoot): number {
  // Read from shadow root's inline style element
  const styleEl = shadowRoot.querySelector('style')
  if (styleEl) {
    // Create a temporary element inside the shadow root to resolve the variable
    const probe = document.createElement('div')
    shadowRoot.appendChild(probe)
    const rawValue = getComputedStyle(probe).getPropertyValue('--panel-open-width').trim()
    shadowRoot.removeChild(probe)
    const parsed = parseInt(rawValue, 10)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  // Fallback — matches the value in index.css so they stay in sync
  console.warn('[Copilot] Could not read --panel-open-width from shadow root; using fallback 360px')
  return 360
}

/**
 * syncGmailLayout — the ONLY place in this file that touches the real Gmail DOM.
 *
 * On expand:
 *   - Sets document.documentElement.style.marginRight to the panel's open width.
 *   - We target <html> rather than <body> because Gmail explicitly measures
 *     window.innerWidth and positions its columns off the viewport, not off
 *     the body's client width. Shrinking the html element's *usable* width
 *     via margin-right reduces document.documentElement.clientWidth, which
 *     is what Gmail's layout JS uses.
 *   - We do NOT account for Gmail's own right chrome (Chat/Rooms icon strip,
 *     ~56px) because that strip is already *inside* Gmail's layout — Gmail
 *     already subtracts it when computing its content columns. Applying our
 *     margin on top of Gmail's layout is additive, not conflicting.
 *   - Dispatches window resize so Gmail's JS immediately remeasures.
 *
 * On collapse:
 *   - Removes the margin and dispatches resize.
 *
 * SPA guard:
 *   - Gmail is a SPA and may rewrite body/html styles on internal navigation.
 *   - We use a MutationObserver on document.documentElement to re-apply the
 *     margin if Gmail wipes it while the panel is open.
 */
let _isLayoutOpen = false
let _shadowRootRef: ShadowRoot | null = null
let _gmailLayoutObserver: MutationObserver | null = null

function syncGmailLayout(isOpen: boolean) {
  _isLayoutOpen = isOpen

  if (isOpen) {
    const width = _shadowRootRef ? getPanelOpenWidth(_shadowRootRef) : 360
    applyMargin(width)
    startGmailSpaGuard(width)
  } else {
    stopGmailSpaGuard()
    applyMargin(0)
  }

  // Tell Gmail's JS to remeasure the viewport
  window.dispatchEvent(new Event('resize'))
}

function applyMargin(widthPx: number) {
  if (widthPx > 0) {
    document.documentElement.style.marginRight = `${widthPx}px`
    document.documentElement.style.boxSizing   = 'border-box'
  } else {
    document.documentElement.style.marginRight = ''
    document.documentElement.style.boxSizing   = ''
  }
}

/**
 * Gmail SPA guard — re-applies the margin if Gmail's internal navigation
 * removes it (Gmail occasionally rewrites html/body inline styles on route
 * changes).
 */
function startGmailSpaGuard(widthPx: number) {
  stopGmailSpaGuard() // clear any previous observer

  _gmailLayoutObserver = new MutationObserver(() => {
    if (!_isLayoutOpen) return
    const current = document.documentElement.style.marginRight
    if (current !== `${widthPx}px`) {
      // Gmail wiped our margin — restore it silently
      document.documentElement.style.marginRight = `${widthPx}px`
    }
  })

  _gmailLayoutObserver.observe(document.documentElement, {
    attributes:      true,
    attributeFilter: ['style'],
  })
}

function stopGmailSpaGuard() {
  _gmailLayoutObserver?.disconnect()
  _gmailLayoutObserver = null
}

function getCurrentGmailThreadId(): string | null {
  // Gmail conversation URLs look like #inbox/<threadId>, #all/<threadId>,
  // #sent/<threadId>, etc. — same format this file already WRITES in the
  // 'copilot:navigate-thread' listener.
  const match = window.location.hash.match(/^#[a-z]+\/([a-zA-Z0-9_-]+)$/)
  return match ? match[1] : null
}

// ── Detect + inject ─────────────────────────────────────────────────────────
function mount() {
  // Avoid double injection
  if (document.getElementById(CONTAINER_ID)) return

  // Host element — fixed below Gmail's header so the avatar is never covered
  const host = document.createElement('div')
  host.id = CONTAINER_ID
  host.style.cssText = `
    position: fixed;
    top: ${GMAIL_HEADER_HEIGHT}px;
    right: 0;
    height: calc(100vh - ${GMAIL_HEADER_HEIGHT}px);
    width: auto;
    z-index: 9999;
    display: flex;
    align-items: stretch;
    pointer-events: none;
  `
  document.body.appendChild(host)

  // Shadow root for style isolation
  const shadow = host.attachShadow({ mode: 'open' })
  _shadowRootRef = shadow

  // Inject the bundled CSS (including @font-face with chrome-extension:// URLs)
  const styleEl = document.createElement('style')
  styleEl.textContent = injectFontUrls(styles)
  shadow.appendChild(styleEl)

  // A wrapper div that re-enables pointer events for the panel itself
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'pointer-events: auto; height: 100%; display: flex; align-items: stretch;'
  shadow.appendChild(wrapper)

  // Gmail is always light-mode. The extension matches it — no dark class applied.

  // Expose syncGmailLayout to App.tsx via a custom event bridge.
  // App.tsx dispatches 'copilot:panel-open' / 'copilot:panel-close' on
  // the shadow host; we listen here and call syncGmailLayout accordingly.
  // This keeps the Gmail DOM boundary inside content.tsx only.
  host.addEventListener('copilot:panel-open',  () => syncGmailLayout(true))
  host.addEventListener('copilot:panel-close', () => syncGmailLayout(false))

  host.addEventListener('copilot:navigate-thread', (e: Event) => {
    const { threadId } = (e as CustomEvent).detail
    window.location.hash = `#inbox/${threadId}`
  })

  // Watch for Gmail conversation transitions
  window.addEventListener('hashchange', () => {
    // No-op (handled in App.tsx)
  })

  // React root inside shadow DOM
  createRoot(wrapper).render(
    <React.StrictMode>
      <App panelHost={host} getCurrentThreadId={getCurrentGmailThreadId} />
    </React.StrictMode>
  )
}

/**
 * Rewrite `./assets/fonts/` relative paths in the CSS to
 * `chrome-extension://EXTENSION_ID/src/assets/fonts/` absolute URLs.
 * This is required because relative paths inside a <style> tag in shadow DOM
 * don't resolve to the extension's origin.
 */
function injectFontUrls(css: string): string {
  const base = chrome.runtime.getURL('src/assets/fonts/')
  return css.replace(/url\(['\"]?\.\/assets\/fonts\/([^'"\)\s]+)['\"]?\)/g, `url(${base}$1)`)
}

// applyColorScheme intentionally removed:
// Gmail's UI is always light-mode. The extension must match it.
// If dark mode support is added in future, re-introduce this function
// and ensure Gmail itself has been switched to dark mode first.

// ── Bootstrap ────────────────────────────────────────────────────────────────
// Wait for Gmail's DOM to be ready before injecting the panel
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount)
} else {
  mount()
}
