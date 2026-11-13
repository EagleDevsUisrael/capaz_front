import { useId } from 'react'
import { ToggleButton, ToggleButtonGroup } from 'react-aria-components'
import { CheckIcon } from './icons'
import './ui.css'

export interface ChipOption<T extends string> {
  value: T
  label: string
}

interface BaseProps<T extends string> {
  /** Pregunta visible sobre el grupo (se enlaza por aria-labelledby) */
  label: string
  /** Texto secundario junto a la pregunta, p. ej. "(opcional)" */
  labelHint?: string
  options: ChipOption<T>[]
  /** "large": dos botones grandes que se reparten el ancho (¿Has trabajado antes?) */
  variant?: 'chip' | 'large'
}

interface SingleProps<T extends string> extends BaseProps<T> {
  selectionMode: 'single'
  value: T | null
  onChange: (value: T | null) => void
}

interface MultiProps<T extends string> extends BaseProps<T> {
  selectionMode: 'multiple'
  value: T[]
  onChange: (value: T[]) => void
}

/**
 * Grupo de opciones tipo chip. Una sola opción (role=radiogroup) o varias (role=group).
 * La opción elegida lleva ✓ además del color, para que el estado no dependa solo del color.
 */
export function ChipGroup<T extends string>(props: SingleProps<T> | MultiProps<T>) {
  const labelId = useId()
  const { label, labelHint, options, variant = 'chip' } = props
  const selected = props.selectionMode === 'single' ? (props.value ? [props.value] : []) : props.value

  const handleChange = (keys: Set<unknown>) => {
    const values = [...keys] as T[]
    if (props.selectionMode === 'single') props.onChange(values[0] ?? null)
    else props.onChange(values)
  }

  return (
    <div className="ui-chipgroup">
      <span id={labelId} className="ui-chipgroup__label">
        {label}
        {labelHint && <span className="ui-chipgroup__hint"> {labelHint}</span>}
      </span>
      <ToggleButtonGroup
        aria-labelledby={labelId}
        selectionMode={props.selectionMode}
        disallowEmptySelection={false}
        selectedKeys={selected}
        onSelectionChange={handleChange}
        className={`ui-chipgroup__items ui-chipgroup__items--${variant}`}
      >
        {options.map((o) => (
          <ToggleButton key={o.value} id={o.value} className={`ui-chip ui-chip--${variant}`}>
            {({ isSelected }) => (
              <>
                {isSelected && <CheckIcon size={18} />}
                {o.label}
              </>
            )}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  )
}
