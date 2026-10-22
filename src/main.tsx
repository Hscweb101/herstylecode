import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

/* Discourage casual inspecting: block right-click and the usual DevTools / view-source shortcuts.
   Forms stay usable (right-click paste still works in inputs). This is a deterrent, not real protection. */
document.addEventListener('contextmenu', (e) => {
  if ((e.target as HTMLElement).closest('input, textarea')) return
  e.preventDefault()
})
document.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase()
  if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(k)) || (e.ctrlKey && k === 'u') || (e.metaKey && e.altKey && ['i', 'j', 'c', 'u'].includes(k))) {
    e.preventDefault()
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#600619',
            color: '#F3E9D8',
            fontFamily: 'Poppins, sans-serif',
            fontSize: '14px',
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
)
