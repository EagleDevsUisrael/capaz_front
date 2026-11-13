/** Logo de Capaz: cuadrado amarillo con "C" + nombre. Sobre fondo oscuro el texto va en blanco. */
export function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <span className={`logo${onDark ? ' logo--on-dark' : ''}`}>
      <span className="logo__mark" aria-hidden="true">C</span>
      <span className="logo__name">Capaz</span>
    </span>
  )
}
