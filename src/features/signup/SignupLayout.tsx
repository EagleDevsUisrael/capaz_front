import { Link, Outlet, useLocation } from 'react-router'
import { useA11yPrefs } from '@/features/accessibility/useA11yPrefs'
import { Logo, SkipLink } from '@/shared/ui'
import { ArrowLeftIcon, CheckIcon, PhoneIcon, VolumeIcon } from '@/shared/ui/icons'
import { SIGNUP_STEPS } from './steps'
import { useSignupStore } from './useSignupStore'
import './signup.css'

/**
 * Esqueleto de los 4 pasos del registro.
 * Escritorio: barra lateral oscura (oferta, pasos, ayuda) + contenido. Celular: barra superior simple.
 */
export function SignupLayout() {
  const { pathname } = useLocation()
  const pendingJob = useSignupStore((s) => s.pendingJob)
  const completed = useSignupStore((s) => s.completed)
  const readScreen = useA11yPrefs((s) => s.readScreen)
  const setReadScreen = useA11yPrefs((s) => s.setReadScreen)

  const current = SIGNUP_STEPS.find((s) => pathname.startsWith(s.path))?.n ?? 1
  const backTo = current === 1 ? '/' : SIGNUP_STEPS[current - 2].path

  return (
    <div className="signup">
      <SkipLink />

      {/* Celular: Atrás + Leer */}
      <header className="signup__topbar">
        <Link to={backTo} className="signup__back">
          <ArrowLeftIcon size={20} /> Atrás
        </Link>
        <button
          type="button"
          className={`signup__read${readScreen ? ' is-active' : ''}`}
          aria-pressed={readScreen}
          onClick={() => setReadScreen(!readScreen)}
        >
          <VolumeIcon size={20} /> Leer
        </button>
      </header>

      {/* Escritorio: barra lateral */}
      <aside className="signup__side" aria-label="Tu progreso">
        <Link to="/" className="signup__logo">
          <Logo onDark />
        </Link>

        {pendingJob && (
          <div className="signup__job">
            <span className="signup__job-label">Estás postulando a</span>
            <strong className="signup__job-title">{pendingJob.title}</strong>
            <span className="signup__job-sub">{pendingJob.subtitle}</span>
          </div>
        )}

        <ol className="signup__steps">
          {SIGNUP_STEPS.map((s) => {
            const done = completed.includes(s.n) && s.n !== current
            return (
              <li key={s.n} className={`signup__step${s.n === current ? ' is-current' : ''}${done ? ' is-done' : ''}`} aria-current={s.n === current ? 'step' : undefined}>
                <span className="signup__bullet" aria-hidden="true">
                  {done ? <CheckIcon size={20} /> : s.n}
                </span>
                <span>
                  <span className="signup__step-title">{s.title}</span>
                  <span className="signup__step-desc">{s.desc}</span>
                  {done && <span className="sr-only"> (completado)</span>}
                </span>
              </li>
            )
          })}
        </ol>

        <p className="signup__help">
          <PhoneIcon />
          <span>¿Necesitas ayuda? Llama gratis al 1800-CAPAZ o pide que un familiar te acompañe.</span>
        </p>
        <Link to="/accessibility" className="signup__a11y">
          Opciones de accesibilidad
        </Link>
      </aside>

      <main id="main" tabIndex={-1} className="signup__main">
        <Outlet />
      </main>
    </div>
  )
}
