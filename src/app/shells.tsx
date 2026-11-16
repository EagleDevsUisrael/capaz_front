import { Outlet } from 'react-router'
import { AccessibilityBar } from '@/features/accessibility/AccessibilityBar'
import { MobileReadScreenPrompt } from '@/features/accessibility/MobileReadScreenPrompt'
import { SkipLink } from '@/shared/ui'
import { AppHeader } from './AppHeader'
import { TabBar } from './TabBar'

/** Pantallas públicas: barra de accesibilidad (escritorio) + cabecera + contenido. */
export function PublicShell() {
  return (
    <>
      <SkipLink />
      <MobileReadScreenPrompt />
      <AccessibilityBar />
      <AppHeader />
      <main id="main" tabIndex={-1} className="public-main">
        <Outlet />
      </main>
      <TabBar />
    </>
  )
}

/** Pantallas sin cabecera (ingresar, cámara, admin, opciones de accesibilidad). */
export function PlainShell() {
  return (
    <>
      <SkipLink />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  )
}
