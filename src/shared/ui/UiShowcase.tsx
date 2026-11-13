import { useState } from 'react'
import { useA11yPrefs, type Vision } from '@/features/accessibility/useA11yPrefs'
import { Button, Chip, Field, Switch } from '@/shared/ui'

/** Solo desarrollo (/dev/ui): muestrario de componentes y temas para revisar el sistema visual. */

const VISIONS: { value: Vision; label: string }[] = [
  { value: 'normal', label: 'Colores normales' },
  { value: 'redGreen', label: 'Rojo / verde' },
  { value: 'blueYellow', label: 'Azul / amarillo' },
  { value: 'mono', label: 'Monocromo' },
  { value: 'highContrast', label: 'Alto contraste' },
]

const TOKENS = ['ink', 'bg', 'surface', 'text', 'muted', 'line', 'brand', 'brand-soft', 'sun', 'rec', 'ods']

const section: React.CSSProperties = {
  background: 'var(--surface)',
  border: 'var(--border-w) solid var(--line)',
  borderRadius: 'var(--radius-l)',
  padding: 20,
  display: 'grid',
  // minmax(0, 1fr): sin esto la columna crece al ancho mínimo del contenido y aparece scroll horizontal con letra grande
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: 16,
}

export function UiShowcase() {
  const { vision, setVision, fontLarge, setFontLarge, easyRead, setEasyRead } = useA11yPrefs()
  const [email, setEmail] = useState('')
  const [micOn, setMicOn] = useState(true)

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 64px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 20 }}>
      <h1>Muestrario de componentes</h1>
      <p style={{ color: 'var(--muted)' }}>
        Página solo de desarrollo para revisar tokens, temas y componentes base.
      </p>

      <section aria-labelledby="h-prefs" style={section}>
        <h2 id="h-prefs">Preferencias de accesibilidad</h2>
        <div role="group" aria-label="Modo de color" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {VISIONS.map((v) => (
            <Chip key={v.value} isSelected={vision === v.value} onChange={() => setVision(v.value)}>
              {v.label}
            </Chip>
          ))}
        </div>
        <Switch label="Letra grande" description="Aumenta los textos un 35 %" isSelected={fontLarge} onChange={setFontLarge} />
        <Switch label="Lectura fácil" description="Letra de 20 px" isSelected={easyRead} onChange={setEasyRead} />
      </section>

      <section aria-labelledby="h-btn" style={section}>
        <h2 id="h-btn">Botones</h2>
        <Button>Continuar</Button>
        <Button variant="sun">Postular</Button>
        <Button variant="secondary">Volver</Button>
        <Button variant="ghost">Omitir este paso</Button>
        <Button isDisabled>Deshabilitado</Button>
      </section>

      <section aria-labelledby="h-field" style={section}>
        <h2 id="h-field">Campos y interruptores</h2>
        <Field
          label="Correo electrónico"
          hint="Lo usaremos solo para avisarte de tus postulaciones"
          placeholder="nombre@correo.com"
          value={email}
          onChange={setEmail}
        />
        <Field label="Celular" error="Escribe 10 dígitos que empiecen con 09" defaultValue="0998" />
        <Switch label="Micrófono en todos los campos" description="Para dictar en vez de escribir" isSelected={micOn} onChange={setMicOn} />
      </section>

      <section aria-labelledby="h-tok" style={section}>
        <h2 id="h-tok">Colores del tema actual</h2>
        <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12, listStyle: 'none', margin: 0, padding: 0 }}>
          {TOKENS.map((t) => (
            <li key={t} style={{ display: 'grid', gap: 4 }}>
              <span
                aria-hidden="true"
                style={{ height: 40, borderRadius: 'var(--radius-s)', background: `var(--${t})`, border: '1px solid var(--line)' }}
              />
              <code style={{ fontSize: 13 }}>--{t}</code>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
