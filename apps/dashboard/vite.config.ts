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
    proxy: {
      '/auth': 'http://localhost:3000',
      '/clients': 'http://localhost:3000',
      '/emails': 'http://localhost:3000',
      '/knowledge-base': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      '/queue': 'http://localhost:3000',
      '/gmail': 'http://localhost:3000'
    }
  }
})
