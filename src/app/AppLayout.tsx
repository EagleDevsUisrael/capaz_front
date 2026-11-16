import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'
import { useA11yPrefs } from '@/features/accessibility/useA11yPrefs'
import { useTextToSpeech } from '@/shared/voice/useTextToSpeech'

/**
 * Raíz de todas las rutas. Al cambiar de ruta mueve el foco al <h1> de la nueva pantalla
 * (criterio de aceptación del documento); cada "shell" pone el <main id="main"> y el enlace para saltar.
 */
export function AppLayout() {
  const { pathname } = useLocation()
  const lastPath = useRef(pathname)
  const readScreen = useA11yPrefs((s) => s.readScreen)
  const tts = useTextToSpeech()

  useEffect(() => {
    // No robar el foco en la carga inicial; solo en navegaciones.
    // Se compara con la ruta anterior (no con un "primer render"): en StrictMode el efecto corre dos veces
    // al montar y el foco se iba al <h1>, saltándose el enlace "Saltar al contenido principal".
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    const main = document.getElementById('main')
    const heading = main?.querySelector<HTMLElement>('h1')
    const target = heading ?? main
    if (target) {
      target.setAttribute('tabindex', '-1')
      target.focus()
    }
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    if (!readScreen) {
      tts.stop()
      return
    }
    const timer = window.setTimeout(() => {
      const main = document.getElementById('main')
      if (!main) return
      const heading = main.querySelector('h1')?.textContent?.trim()
      const summary = main.querySelector<HTMLElement>('[data-read-aloud], .hero__lead, .step__lead')?.innerText.trim()
      const actions = [...main.querySelectorAll<HTMLElement>('button, a.ui-button')]
        .filter((el) => el.offsetParent !== null)
        .slice(0, 6)
        .map((el) => el.innerText.trim())
        .filter(Boolean)
      const text = [heading, summary, actions.length ? `Opciones: ${actions.join('. ')}` : ''].filter(Boolean).join('. ')
      if (text) tts.speak(text)
    }, 350)
    return () => window.clearTimeout(timer)
    // `tts` es un objeto nuevo en cada render; las dependencias primitivas evitan repetir la lectura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, readScreen])

  return <Outlet />
}
