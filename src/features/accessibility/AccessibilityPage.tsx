import { Link, useLocation, useNavigate } from 'react-router'
import { Button, ChipGroup, Switch } from '@/shared/ui'
import { ArrowRightIcon, PhoneIcon } from '@/shared/ui/icons'
import { useA11yPrefs } from './useA11yPrefs'
import './accessibility.css'

/** Opciones de accesibilidad en pantalla completa (celular). Misma información que la barra de escritorio. */
export function AccessibilityPage() {
  const p = useA11yPrefs()
  const navigate = useNavigate()
  const location = useLocation()
  // Si entraron directo por el enlace no hay historial al que volver
  const close = () => (location.key === 'default' ? navigate('/') : navigate(-1))

  return (
    <div className="a11y-page">
      <div className="a11y-page__top">
        <Button variant="secondary" onPress={close}>
          Cerrar
        </Button>
      </div>
      <h1>Accesibilidad</h1>
      <p className="a11y-page__lead">Ajusta Capaz a tu manera. Guardamos tus preferencias en este dispositivo.</p>

      <div className="a11y-card">
        <Switch label="Leer la pantalla en voz alta" description="Lee títulos y botones al entrar a cada pantalla." isSelected={p.readScreen} onChange={p.setReadScreen} />
        <Switch label="Micrófono en todos los campos" description="Para dictar en vez de escribir." isSelected={p.mic} onChange={p.setMic} />
        <Link to="/accessibility/colors" className="a11y-link">
          <span>
            <span className="a11y-link__label">Colores para daltonismo</span>
            <span className="a11y-link__desc">Elige cómo ves mejor los colores. Toca para ver ejemplos.</span>
          </span>
          <ArrowRightIcon />
        </Link>
        <Switch
          label="Alto contraste"
          description="Negro y blanco, bordes gruesos. Apaga los colores para daltonismo."
          isSelected={p.vision === 'highContrast'}
          onChange={(on) => p.setVision(on ? 'highContrast' : 'normal')}
        />
        <Switch label="Lectura fácil" description="Frases más cortas y sencillas." isSelected={p.easyRead} onChange={p.setEasyRead} />
        <ChipGroup
          label="Tamaño de letra"
          selectionMode="single"
          variant="large"
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'large', label: 'Grande' },
          ]}
          value={p.fontLarge ? 'large' : 'normal'}
          onChange={(v) => p.setFontLarge(v === 'large')}
        />
      </div>

      <p className="a11y-help">
        <PhoneIcon />
        <span>¿Prefieres que te ayudemos por teléfono? Llama gratis al 1800-CAPAZ.</span>
      </p>
    </div>
  )
}
