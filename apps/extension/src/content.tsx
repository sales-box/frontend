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
 */

const CONTAINER_ID = 'inbox-copilot-root'
const DARK_CLASS   = 'dark'

// ── Detect + inject ─────────────────────────────────────────────────────────
function mount() {
  // Avoid double injection
  if (document.getElementById(CONTAINER_ID)) return

  // Host element — appended to Gmail's sidebar area
  const host = document.createElement('div')
  host.id = CONTAINER_ID
  host.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    width: auto;
    z-index: 9999;
    display: flex;
    align-items: stretch;
    pointer-events: none;
  `
  document.body.appendChild(host)

  // Shadow root for style isolation
  const shadow = host.attachShadow({ mode: 'open' })

  // Inject the bundled CSS (including @font-face with chrome-extension:// URLs)
  const styleEl = document.createElement('style')
  styleEl.textContent = injectFontUrls(styles)
  shadow.appendChild(styleEl)

  // A wrapper div that re-enables pointer events for the panel itself
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'pointer-events: auto; height: 100%; display: flex; align-items: stretch;'
  shadow.appendChild(wrapper)

  // Apply dark mode class based on device preference
  applyColorScheme(wrapper)

  // React root inside shadow DOM
  createRoot(wrapper).render(
    <React.StrictMode>
      <App />
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
  return css.replace(/url\(['"]?\.\/assets\/fonts\/([^'")\s]+)['"]?\)/g, `url(${base}$1)`)
}

/**
 * Apply the `dark` class based on prefers-color-scheme.
 * The panel follows device preference — no manual toggle needed.
 */
function applyColorScheme(el: HTMLElement) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const apply = (dark: boolean) => {
    el.classList.toggle(DARK_CLASS, dark)
  }
  apply(mq.matches)
  mq.addEventListener('change', (e) => apply(e.matches))
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
// Wait for Gmail's DOM to be ready before injecting the panel
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount)
} else {
  mount()
}
