import { useState } from 'react'
import { Link, NavLink } from 'react-router'
import { Logo } from '@/shared/ui'
import './shell.css'

/**
 * Cabecera con logo, menú e "Ingresar".
 * Celular: logo + "Opciones" + "Ingresar". Escritorio: menú en línea.
 * Con letra grande el menú pasa a un botón "Menú" (documento: así no se corta nada).
 * TODO(equipo): "Cómo funciona" y "Para empresas" del mockup no tienen ruta (portal de empresas fuera del MVP).
 */
export function AppHeader() {
  const [open, setOpen] = useState(false)

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
          <Link to="/login" className="ui-button ui-button--sun">Ingresar</Link>
        </div>
      </div>
    </header>
  )
}
