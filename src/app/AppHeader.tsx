import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import { useSession } from '@/features/auth/useSession'
import { logout as apiLogout } from '@/features/auth/api'
import { loginUrl } from '@/features/auth/RequireSession'
import { Logo } from '@/shared/ui'
import './shell.css'

/**
 * Cabecera con logo, menú y sesión.
 * Sin sesión: "Ingresar". Con sesión: nombre de la persona + menú (Mis postulaciones, Para ti, Cerrar sesión).
 * Con letra grande el menú pasa a un botón "Menú" (documento: así no se corta nada).
 */
export function AppHeader() {
  const [open, setOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const userRef = useRef<HTMLDivElement>(null)

  // Menú de la cuenta: se cierra con Escape o al tocar fuera
  useEffect(() => {
    if (!userOpen) return
    // Escape cierra y devuelve el foco al botón que abrió el menú (si no, el foco se pierde en <body>)
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setUserOpen(false)
      userRef.current?.querySelector<HTMLButtonElement>('.app-header__user-btn')?.focus()
    }
    const onDown = (e: PointerEvent) => {
      if (!userRef.current?.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [userOpen])
  const signedIn = useSession((s) => s.signedIn)
  const name = useSession((s) => s.profile?.contact.fullName ?? s.profile?.idCard.fullName)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  async function logout() {
    setUserOpen(false)
    await apiLogout()
    navigate('/')
  }

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link to="/" className="app-header__logo">
          <Logo onDark />
        </Link>

        <button
          type="button"
          className="app-header__menu"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen((o) => !o)}
        >
          Menú
        </button>

        <nav id="main-nav" aria-label="Principal" className={`app-header__nav${open ? ' is-open' : ''}`}>
          <NavLink to="/" end onClick={() => setOpen(false)}>Buscar empleo</NavLink>
          <NavLink to="/for-you" onClick={() => setOpen(false)}>Para ti</NavLink>
          <NavLink to="/applications" onClick={() => setOpen(false)}>Mis postulaciones</NavLink>
          <NavLink to="/accessibility" onClick={() => setOpen(false)}>Ayuda y accesibilidad</NavLink>
        </nav>

        <div className="app-header__actions">
          <Link to="/accessibility" className="app-header__options">Opciones</Link>
          {signedIn ? (
            <div className="app-header__user" ref={userRef}>
              <button
                type="button"
                className="app-header__menu app-header__user-btn"
                aria-expanded={userOpen}
                aria-controls="user-menu"
                onClick={() => setUserOpen((o) => !o)}
              >
                <span className="visually-hidden">Tu cuenta: </span>
                {name?.split(' ')[0] || 'Mi cuenta'}
              </button>
              {userOpen && (
                <ul id="user-menu" className="app-header__user-menu">
                  <li><Link to="/profile" onClick={() => setUserOpen(false)}>Mi perfil de trabajo</Link></li>
                  <li><Link to="/applications" onClick={() => setUserOpen(false)}>Mis postulaciones</Link></li>
                  <li><Link to="/for-you" onClick={() => setUserOpen(false)}>Para ti</Link></li>
                  <li><button type="button" onClick={logout}>Cerrar sesión</button></li>
                </ul>
              )}
            </div>
          ) : (
            <Link to={loginUrl(pathname)} className="ui-button ui-button--sun">Ingresar</Link>
          )}
        </div>
      </div>
    </header>
  )
}
