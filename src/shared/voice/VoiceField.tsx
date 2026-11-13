import { useState } from 'react'
import { Button as AriaButton } from 'react-aria-components'
import { useA11yPrefs } from '@/features/accessibility/useA11yPrefs'
import { Field, type FieldProps } from '@/shared/ui/Field'
import { MicIcon, StopIcon } from '@/shared/ui/icons'
import { normalizers, type FieldKind } from './normalizers'
import { useSpeechToText, type SttError } from './useSpeechToText'
import { useTextToSpeech } from './useTextToSpeech'
import './voice.css'

export interface VoiceFieldProps extends Omit<FieldProps, 'endSlot' | 'value' | 'onChange' | 'hint'> {
  /** Tipo de campo: decide cómo se normaliza lo dictado ("arroba" → @, "cero nueve" → 09…) */
  kind: FieldKind
  value: string
  onChange: (value: string) => void
  /** Pista que se ve cuando no se está dictando (p. ej. 'Di “arroba” para @') */
  hint?: string
}

const ERROR_TEXT: Record<Exclude<SttError, null>, string> = {
  denied:
    'El micrófono está bloqueado. Toca el candado junto a la dirección de la página y permite el micrófono. Mientras tanto puedes escribir.',
  'no-speech': 'No te escuchamos. Toca el micrófono e inténtalo otra vez.',
  other: 'No te escuchamos. Toca el micrófono e inténtalo otra vez.',
  // TODO(backend): respaldo con MediaRecorder + POST /api/transcribe (Firefox y navegadores sin SpeechRecognition)
  unsupported: 'Tu navegador todavía no permite dictar. Puedes escribir con el teclado.',
}

/**
 * Campo de texto con botón de micrófono al lado (documento: "Voz a texto").
 * Estados: idle → listening → done | error. Cada estado se anuncia por aria-live; la confirmación en voz
 * alta (speak) solo suena si "Leer pantalla" está activo, para que nunca hablen dos voces a la vez.
 */
export function VoiceField({ kind, value, onChange, hint, label, multiline, ...props }: VoiceFieldProps) {
  const micEnabled = useA11yPrefs((s) => s.mic)
  const readScreen = useA11yPrefs((s) => s.readScreen)
  const stt = useSpeechToText('es-EC')
  const tts = useTextToSpeech()
  const [heard, setHeard] = useState('')

  const listening = stt.status === 'listening'
  const isLong = kind === 'longText'

  const onMicPress = () => {
    if (listening) {
      stt.stop()
      return
    }
    stt.start((raw) => {
      const text = normalizers[kind](raw)
      onChange(isLong && value.trim() ? `${value.trim()} ${text}` : text)
      setHeard(text)
      if (readScreen) tts.speak(isLong ? `Agregamos: ${text}` : `${label}: ${text}`)
    })
  }

  // El mensaje bajo el campo cambia con el estado
  let message = hint
  let announce = ''
  if (listening) {
    message = 'Habla ahora. Toca el cuadrado para terminar.'
    announce = 'Escuchando'
  } else if (stt.status === 'done' && heard) {
    message = isLong ? `Agregamos: «${heard}». ¿Es correcto?` : `Entendimos: ${heard}. ¿Es correcto?`
    announce = message
  } else if (stt.status === 'error' && stt.error) {
    message = `⚠ ${ERROR_TEXT[stt.error]}`
    announce = ERROR_TEXT[stt.error]
  }

  const name = label.toLowerCase()

  return (
    <>
      <Field
        {...props}
        label={label}
        value={value}
        onChange={onChange}
        multiline={multiline ?? isLong}
        hint={message}
        endSlot={
          micEnabled ? (
            <AriaButton
              className={`voice-mic${listening ? ' voice-mic--listening' : ''}`}
              aria-label={`Dictar ${name}`}
              aria-pressed={listening}
              onPress={onMicPress}
            >
              {listening ? <StopIcon size={26} /> : <MicIcon size={26} />}
            </AriaButton>
          ) : undefined
        }
      />
      {/* Anuncios para lectores de pantalla (TalkBack / VoiceOver) */}
      <div className="sr-only" aria-live={listening || stt.status === 'error' ? 'assertive' : 'polite'} role="status">
        {announce}
      </div>
    </>
  )
}
