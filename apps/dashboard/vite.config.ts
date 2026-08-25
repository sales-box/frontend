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
      [
        '/platform',
        '/auth',
        '/tenants',
        '/clients',
        '/emails',
        '/knowledge-base',
        '/analytics',
        '/external-content',
        '/ai',
        '/health',
        '/queue',
        '/gmail',
        '/payments',
        '/stripe'
      ].map(p => [p, { target: process.env.VITE_API_BASE_URL || 'http://localhost:3000', changeOrigin: true, secure: false }])
    )
  }
})
