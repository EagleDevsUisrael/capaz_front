import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'

/**
 * Raíz de todas las rutas. Al cambiar de ruta mueve el foco al <h1> de la nueva pantalla
 * (criterio de aceptación del documento); cada "shell" pone el <main id="main"> y el enlace para saltar.
 */
export function AppLayout() {
  const { pathname } = useLocation()
  const firstRender = useRef(true)

  useEffect(() => {
    // No robar el foco en la carga inicial; solo en navegaciones
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const main = document.getElementById('main')
    const heading = main?.querySelector<HTMLElement>('h1')
    const target = heading ?? main
    if (target) {
      target.setAttribute('tabindex', '-1')
      target.focus()
    }
    window.scrollTo(0, 0)
  }, [pathname])

  return <Outlet />
}
