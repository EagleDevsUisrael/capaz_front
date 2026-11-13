import { useCallback, useEffect, useState } from 'react'
import { useA11yPrefs } from '@/features/accessibility/useA11yPrefs'

const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window

/**
 * Elige una voz en español: primero es-EC, luego es-419 (Latinoamérica), luego cualquier es-*.
 * Las voces cargan de forma asíncrona: se vuelve a leer en el evento "voiceschanged".
 */
export function useSpanishVoice(): SpeechSynthesisVoice | undefined {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | undefined>()

  useEffect(() => {
    if (!canSpeak) return
    const pick = () => {
      const voices = window.speechSynthesis.getVoices()
      const lang = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-').toLowerCase()
      setVoice(
        voices.find((v) => lang(v) === 'es-ec') ??
          voices.find((v) => lang(v) === 'es-419') ??
          voices.find((v) => lang(v).startsWith('es')),
      )
    }
    pick()
    window.speechSynthesis.addEventListener('voiceschanged', pick)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', pick)
  }, [])

  return voice
}

/** Texto a voz con speechSynthesis (gratis). La velocidad (0,8 / 1 / 1,25) viene de las preferencias. */
export function useTextToSpeech() {
  const rate = useA11yPrefs((s) => s.rate)
  const voice = useSpanishVoice()

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!canSpeak) return
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = voice?.lang ?? 'es-EC'
      if (voice) u.voice = voice
      u.rate = rate
      u.onend = () => onEnd?.()
      window.speechSynthesis.speak(u)
    },
    [voice, rate],
  )

  return {
    isSupported: canSpeak,
    speak,
    pause: () => canSpeak && window.speechSynthesis.pause(),
    resume: () => canSpeak && window.speechSynthesis.resume(),
    stop: () => canSpeak && window.speechSynthesis.cancel(),
  }
}
