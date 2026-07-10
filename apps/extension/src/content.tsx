import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const rootId = 'inbox-sales-copilot-root'

function injectRoot() {
  if (document.getElementById(rootId)) return
  const container = document.createElement('div')
  container.id = rootId
  document.body.appendChild(container)
  
  createRoot(container).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

injectRoot()
