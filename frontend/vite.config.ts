import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Encaminha a previsão para a API Flask. No Docker Compose, API_URL aponta para o serviço da API.
    proxy: {
      '/predict': process.env.API_URL ?? 'http://127.0.0.1:5000',
    },
  },
})
