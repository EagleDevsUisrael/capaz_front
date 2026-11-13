import type { ReactNode } from 'react'
import { Switch as AriaSwitch, type SwitchProps as AriaSwitchProps } from 'react-aria-components'
import './ui.css'

export interface SwitchProps extends Omit<AriaSwitchProps, 'children' | 'className'> {
  label: string
  /** Texto de apoyo bajo el título */
  description?: ReactNode
}

/** Interruptor accesible (role="switch"). El estado se ve por posición e icono ✓, no solo por color. */
export function Switch({ label, description, ...props }: SwitchProps) {
  return (
    <AriaSwitch {...props} className="ui-switch">
      <span className="ui-switch__text">
        <span className="ui-switch__label">{label}</span>
        {description && <span className="ui-switch__desc">{description}</span>}
      </span>
      <span className="ui-switch__track" aria-hidden="true">
        <span className="ui-switch__thumb" />
      </span>
    </AriaSwitch>
  )
}
