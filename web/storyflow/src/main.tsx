import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <a href="#storyflow-main" className="skip-link">
      Skip to Storyflow canvas
    </a>
    <App />
  </StrictMode>,
)
