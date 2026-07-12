import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    proxy: Object.fromEntries(
      ['/auth', '/tenants', '/clients', '/emails', '/knowledge-base', '/analytics', '/external-content', '/ai', '/health', '/queue', '/gmail']
        .map(p => [p, { target: 'https://salesbox.dev', changeOrigin: true, secure: true }])
    )
  }
})
