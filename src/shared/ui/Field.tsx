import type { ReactNode } from 'react'
import {
  FieldError,
  Input,
  Label,
  Text,
  TextArea,
  TextField,
  type TextFieldProps,
} from 'react-aria-components'
import './ui.css'

export interface FieldProps extends Omit<TextFieldProps, 'children' | 'className'> {
  /** Etiqueta visible (siempre hay un <label>) */
  label: string
  /** Pista bajo el campo */
  hint?: string
  /** Mensaje de error (se muestra con icono y texto, nunca solo con color) */
  error?: string
  placeholder?: string
  /** Elemento a la derecha del input (el botón de micrófono de VoiceField) */
  endSlot?: ReactNode
  /** Varias líneas (experiencia, ajustes) */
  multiline?: boolean
  rows?: number
}

/** Campo de texto accesible: label, pista y error enlazados por ARIA, 56 px de alto, texto de 17 px. */
export function Field({ label, hint, error, placeholder, endSlot, multiline, rows = 3, ...props }: FieldProps) {
  return (
    <TextField {...props} isInvalid={props.isInvalid ?? Boolean(error)} className="ui-field">
      <Label className="ui-field__label">{label}</Label>
      <div className="ui-field__row">
        {multiline ? (
          <TextArea className="ui-field__input ui-field__input--multi" placeholder={placeholder} rows={rows} />
        ) : (
          <Input className="ui-field__input" placeholder={placeholder} />
        )}
        {endSlot}
      </div>
      {hint && (
        <Text slot="description" className="ui-field__hint">
          {hint}
        </Text>
      )}
      <FieldError className="ui-field__error">
        <span aria-hidden="true">⚠ </span>
        {error}
      </FieldError>
    </TextField>
  )
}
