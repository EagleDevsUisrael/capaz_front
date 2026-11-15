import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { Providers } from '@/app/providers'
import { router } from '@/app/router'
import '@/styles/base.css'

// Auditoría de accesibilidad en desarrollo: axe avisa en la consola de errores de ARIA/contraste
if (import.meta.env.DEV) {
  void Promise.all([import('react'), import('react-dom'), import('@axe-core/react')]).then(
    ([React, ReactDOM, axe]) => axe.default(React, ReactDOM, 1000),
  )
}

// Datos de prueba (MSW): el admin y el match funcionan sin backend real (documento). Se apagan con VITE_API_MOCKS=false.
async function enableMocking() {
  if (import.meta.env.VITE_API_MOCKS === 'false') return
  const { worker } = await import('@/mocks/browser')
  await worker.start({ onUnhandledFrame: 'bypass', quiet: true })
}

void enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </StrictMode>,
  )
})
