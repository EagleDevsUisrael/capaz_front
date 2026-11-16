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

// La app habla directo con capaz_backend (sin MSW)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
)
