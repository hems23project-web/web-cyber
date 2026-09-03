import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

import './styles/global.css'
import './styles/landing.css'
import './styles/ctf.css'
import './styles/reveal.css'

const container = document.getElementById('root')
if (!container) throw new Error('#root missing')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
