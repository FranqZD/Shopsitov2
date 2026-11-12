import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Mismo origen en local: /api/* se reenvía al Worker de Wrangler, así no hace falta CORS.
    proxy: {
      '/api': process.env.API_URL ?? 'http://localhost:8787',
    },
    // Docker en Mac/Windows a veces no propaga eventos del sistema de archivos.
    watch: process.env.VITE_USE_POLLING ? { usePolling: true, interval: 300 } : undefined,
  },
})
