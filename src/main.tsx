import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#241318',
            color: '#fffaf9',
            fontFamily: 'Poppins, sans-serif',
            fontSize: '14px',
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
)
