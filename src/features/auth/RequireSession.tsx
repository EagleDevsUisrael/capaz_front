import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useSession } from './useSession'

/** URL de ingreso que vuelve a la página actual al terminar */
export const loginUrl = (next: string) => `/login?next=${encodeURIComponent(next)}`

/**
 * Protege una pantalla: sin sesión, redirige a /login?next=<ruta actual>.
 * Uso: <RequireSession><MiPagina /></RequireSession> (o como element de una ruta padre con <Outlet/>).
 */
export function RequireSession({ children }: { children: ReactNode }) {
  const signedIn = useSession((s) => s.signedIn)
  const loc = useLocation()
  if (!signedIn) return <Navigate to={loginUrl(loc.pathname + loc.search)} replace />
  return <>{children}</>
}
