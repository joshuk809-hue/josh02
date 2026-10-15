import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import '@fontsource/kanit/latin-300.css'
import '@fontsource/kanit/latin-400.css'
import '@fontsource/kanit/latin-500.css'
import '@fontsource/kanit/latin-600.css'
import '@fontsource/kanit/latin-700.css'
import '@fontsource/kanit/latin-900.css'
import './index.css'

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)

// Studio only: offline support once it's installed on the home screen (sw.js exists only in the studio build).
if (import.meta.env.VITE_APP === 'studio' && 'serviceWorker' in navigator && location.protocol !== 'file:')
  navigator.serviceWorker.register('sw.js').catch(() => {})
