import { NavLink } from 'react-router'
import { useSession } from '@/features/auth/useSession'

/** Barra inferior de pestañas (solo celular, diseño "Móvil — Mis postulaciones"). */
export function TabBar() {
  const signedIn = useSession((s) => s.signedIn)
  return (
    <nav aria-label="Secciones" className="tab-bar">
      <NavLink to="/" end>Buscar</NavLink>
      <NavLink to="/for-you">Para ti</NavLink>
      <NavLink to="/applications">Postulaciones</NavLink>
      <NavLink to={signedIn ? '/accessibility' : '/login'}>{signedIn ? 'Perfil' : 'Ingresar'}</NavLink>
    </nav>
  )
}
