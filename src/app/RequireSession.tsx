import { Outlet } from 'react-router'
import { RequireSession } from '@/features/auth/RequireSession'

/** Ruta padre que pide sesión: usa el guardián de auth (redirige a /login?next=...). */
export function RequireSessionRoute() {
  return (
    <RequireSession>
      <Outlet />
    </RequireSession>
  )
}
