import { useCallback, useEffect, useRef, useState } from 'react'

export type SttStatus = 'idle' | 'listening' | 'done' | 'error'
/** Motivo del error, para explicar qué hacer (p. ej. activar el permiso del micrófono) */
export type SttError = 'denied' | 'no-speech' | 'unsupported' | 'other' | null

type RecognitionClass = typeof SpeechRecognition

// Chrome y Safari la exponen con prefijo webkit; los tipos las declaran como variables globales
function getRecognitionClass(): RecognitionClass | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as { SpeechRecognition?: RecognitionClass; webkitSpeechRecognition?: RecognitionClass }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

/**
 * Voz a texto con la Web Speech API del navegador (gratis, sin servidor).
 * Funciona en Chrome/Edge y Safari iOS; NO en Firefox (ahí habrá que usar el respaldo /api/transcribe).
 * Debe iniciarse con un toque de la persona: el navegador no deja empezar solo.
 */
export function useSpeechToText(lang = 'es-EC') {
  const SR = getRecognitionClass()
  const isSupported = Boolean(SR)
  const [status, setStatus] = useState<SttStatus>('idle')
  const [error, setError] = useState<SttError>(null)
  const recRef = useRef<SpeechRecognition | null>(null)

  const start = useCallback(
    (onText: (text: string) => void) => {
      if (!SR) {
        setError('unsupported')
        setStatus('error')
        return
      }
      const rec = new SR()
      rec.lang = lang
      rec.interimResults = false
      rec.maxAlternatives = 1

      let gotResult = false
      rec.onresult = (e) => {
        gotResult = true
        onText(e.results[0][0].transcript)
        setError(null)
        setStatus('done')
      }
      rec.onerror = (e) => {
        gotResult = true // el error ya fijó el estado; onend no debe pisarlo
        setError(
          e.error === 'not-allowed' || e.error === 'service-not-allowed'
            ? 'denied'
            : e.error === 'no-speech'
              ? 'no-speech'
              : 'other',
        )
        setStatus('error')
      }
      rec.onend = () => {
        // Terminó sin resultado ni error (la persona tocó el cuadrado sin hablar)
        setStatus((s) => (s === 'listening' && !gotResult ? 'idle' : s))
        if (recRef.current === rec) recRef.current = null
      }

      recRef.current?.abort()
      recRef.current = rec
      setError(null)
      setStatus('listening')
      try {
        rec.start()
      } catch {
        setError('other')
        setStatus('error')
      }
    },
    [SR, lang],
  )

  const stop = useCallback(() => recRef.current?.stop(), [])

  // Si el componente se desmonta (cambio de paso) se corta el micrófono
  useEffect(() => () => recRef.current?.abort(), [])

  return { isSupported, status, error, start, stop }
}
