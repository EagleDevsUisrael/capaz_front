import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  /**
   * `npm run dev:phone` (modo "phone"): HTTPS con certificado propio y abierto en la red local, para probar
   * en el celular. La cámara (foto del carnet) y el micrófono solo funcionan con HTTPS fuera de localhost.
   */
  const phone = mode === 'phone'
  return {
    plugins: [react(), ...(phone ? [basicSsl({ name: 'capaz-dev' })] : [])],
    // En desarrollo, /api va al back (capaz_backend con npm run dev)
    server: {
      ...(phone && { host: true }),
      proxy: { '/api': { target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:3000', changeOrigin: true } },
    },
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
  }
})
