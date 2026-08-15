import { describe, it, expect } from 'vitest'
import { assetUrl } from './assetUrl'

describe('assetUrl', () => {
  it('passes data: URIs through untouched', () => {
    // Vite inlines assets under 4096 bytes. Wrapping these in getURL()
    // produces chrome-extension://<id>/data:image/... which 404s — the bug
    // that left the mascot as a broken image.
    const inlined = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%3e%3c/svg%3e"
    expect(assetUrl(inlined)).toBe(inlined)
  })

  it('passes blob: URLs through untouched', () => {
    expect(assetUrl('blob:https://mail.google.com/abc')).toBe('blob:https://mail.google.com/abc')
  })

  it('resolves file paths through chrome.runtime.getURL', () => {
    // setup.ts mocks getURL as an identity function, so this asserts the
    // call happened rather than the exact extension origin.
    expect(chrome.runtime.getURL).toBeDefined()
    expect(assetUrl('src/assets/mascot-sleepy.png')).toBe('src/assets/mascot-sleepy.png')
    expect(chrome.runtime.getURL).toHaveBeenCalledWith('src/assets/mascot-sleepy.png')
  })
})
