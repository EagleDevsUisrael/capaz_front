interface Props {
  /** Título visible de la pantalla (un solo <h1> por pantalla) */
  title: string
  /** Ruta del documento */
  route: string
  /** Nombre(s) exacto(s) del frame en Pencil, para encontrarlo en el lienzo */
  frames: string[]
}

/** Pantalla provisional hasta que se construya. Muestra a qué frame del mockup corresponde. */
export function PagePlaceholder({ title, route, frames }: Props) {
  return (
    <div style={{ padding: '32px 16px', maxWidth: 720, margin: '0 auto' }}>
      <h1>{title}</h1>
      <p style={{ marginTop: 12, color: 'var(--muted)' }}>
        Pantalla pendiente de construir. Ruta: <code>{route}</code>
      </p>
      <p style={{ marginTop: 8, color: 'var(--muted)' }}>
        Frame en Pencil: {frames.map((f) => `«${f}»`).join(' · ')}
      </p>
    </div>
  )
}
