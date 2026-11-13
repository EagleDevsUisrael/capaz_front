import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components'
import './ui.css'

export interface ButtonProps extends Omit<AriaButtonProps, 'className'> {
  /**
   * primary: acción principal (azul de marca) · sun: "Postular" (amarillo)
   * secondary: borde y fondo claro · ghost: solo texto
   */
  variant?: 'primary' | 'sun' | 'secondary' | 'ghost'
  /** Ocupa todo el ancho disponible (botones de pie de pantalla en celular) */
  fullWidth?: boolean
  className?: string
}

/** Botón de 56 px de alto como mínimo (68 px con letra grande). Foco, teclado y ARIA vienen de React Aria. */
export function Button({ variant = 'primary', fullWidth, className, ...props }: ButtonProps) {
  const classes = ['ui-button', `ui-button--${variant}`, fullWidth && 'ui-button--full', className]
    .filter(Boolean)
    .join(' ')
  return <AriaButton {...props} className={classes} />
}
