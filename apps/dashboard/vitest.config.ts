import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Node, not jsdom: these tests cover pure logic only. Keeping the DOM out
    // means no extra dependency and no accidental import of browser-only
    // modules such as platform-client.ts.
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
})
