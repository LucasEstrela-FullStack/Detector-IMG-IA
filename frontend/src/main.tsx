import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Acompanha o tema claro/escuro do sistema operacional
const temaEscuro = window.matchMedia('(prefers-color-scheme: dark)')
const aplicarTema = () => document.documentElement.classList.toggle('dark', temaEscuro.matches)
aplicarTema()
temaEscuro.addEventListener('change', aplicarTema)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
