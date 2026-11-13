import { ToggleButton, type ToggleButtonProps } from 'react-aria-components'
import './ui.css'

export interface ChipProps extends Omit<ToggleButtonProps, 'className' | 'children'> {
  children: string
}

/** Chip de filtro: botón de dos estados (aria-pressed). Seleccionado = fondo de marca + icono ✓. */
export function Chip({ children, ...props }: ChipProps) {
  return (
    <ToggleButton {...props} className="ui-chip">
      {({ isSelected }) => (
        <>
          {isSelected && <span aria-hidden="true">✓ </span>}
          {children}
        </>
      )}
    </ToggleButton>
  )
}
