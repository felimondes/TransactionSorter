import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import ErrorBoundary from './ErrorBoundary'

// Global runtime error overlay (shows uncaught errors / unhandled rejections)
function showRuntimeErrorOverlay(message: string) {
  let el = document.getElementById('runtime-error-overlay')
  if (!el) {
    el = document.createElement('div')
    el.id = 'runtime-error-overlay'
    Object.assign(el.style, {
      position: 'fixed', left: '8px', top: '8px', right: '8px', bottom: '8px',
      background: 'rgba(0,0,0,0.85)', color: '#fff', padding: '16px', zIndex: '99999', overflow: 'auto', fontFamily: 'monospace', fontSize: '12px', borderRadius: '8px'
    })
    document.body.appendChild(el)
  }
  el.innerText = message
}

window.addEventListener('error', (ev) => {
  try { showRuntimeErrorOverlay(String(ev.error ? (ev.error.stack || ev.error) : ev.message)) } catch (e) {}
})
window.addEventListener('unhandledrejection', (ev) => {
  try { showRuntimeErrorOverlay(String(ev.reason && ev.reason.stack ? ev.reason.stack : ev.reason)) } catch (e) {}
})

const root = createRoot(document.getElementById('root')!)
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
