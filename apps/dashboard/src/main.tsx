import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { globalToast } from './components/Toast'
import './index.css'
import App from './App.tsx'

function extractMessage(error: unknown): string {
  if (error instanceof Error) {
    const match = error.message.match(/^\d{3}\s[^:]+:\s*(.+)/);
    if (match) return match[1];
    return error.message;
  }
  return 'Something went wrong';
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error) => globalToast(extractMessage(error)),
  }),
  mutationCache: new MutationCache({
    onError: (error) => globalToast(extractMessage(error)),
  }),
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
