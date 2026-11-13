import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Modos de color. 'normal' no pone atributo en <html>.
 * 'highContrast' y los 3 modos de daltonismo se excluyen entre sí: por eso es UN solo campo.
 */
export type Vision = 'normal' | 'redGreen' | 'blueYellow' | 'mono' | 'highContrast'
export type SpeechRate = 0.8 | 1 | 1.25

export interface A11yState {
  /** Leer pantalla en voz alta (apagado por defecto; solo lo enciende la persona) */
  readScreen: boolean
  /** Letra grande (x1,35) */
  fontLarge: boolean
  /** Modo de color: normal, daltonismo (3 modos) o alto contraste */
  vision: Vision
  /** Lectura fácil: textos simples escritos a mano (src/content/easy-read) */
  easyRead: boolean
  /** Botón de micrófono en los campos de texto */
  mic: boolean
  /** Velocidad de la voz: 0,8 / 1 / 1,25 */
  rate: SpeechRate
}

interface A11yActions {
  setReadScreen: (on: boolean) => void
  setFontLarge: (on: boolean) => void
  setVision: (vision: Vision) => void
  setEasyRead: (on: boolean) => void
  setMic: (on: boolean) => void
  setRate: (rate: SpeechRate) => void
  reset: () => void
}

const defaults: A11yState = {
  readScreen: false,
  fontLarge: false,
  vision: 'normal',
  easyRead: false,
  mic: true,
  rate: 1,
}

/** Preferencias de accesibilidad guardadas en el dispositivo (zustand + persist → localStorage). */
export const useA11yPrefs = create<A11yState & A11yActions>()(
  persist(
    (set) => ({
      ...defaults,
      setReadScreen: (readScreen) => set({ readScreen }),
      setFontLarge: (fontLarge) => set({ fontLarge }),
      setVision: (vision) => set({ vision }),
      setEasyRead: (easyRead) => set({ easyRead }),
      setMic: (mic) => set({ mic }),
      setRate: (rate) => set({ rate }),
      reset: () => set(defaults),
    }),
    {
      // Misma clave que lee el script de index.html para evitar el parpadeo inicial
      name: 'capaz-a11y',
      partialize: (s): A11yState => ({
        readScreen: s.readScreen,
        fontLarge: s.fontLarge,
        vision: s.vision,
        easyRead: s.easyRead,
        mic: s.mic,
        rate: s.rate,
      }),
    },
  ),
)

/** Refleja las preferencias en los atributos de <html> que usan los tokens CSS. */
export function applyPrefsToDocument(
  s: Pick<A11yState, 'vision' | 'fontLarge' | 'easyRead'>,
  el: HTMLElement = document.documentElement,
) {
  const set = (name: string, value: string | null) =>
    value === null ? el.removeAttribute(name) : el.setAttribute(name, value)

  set('data-vision', s.vision === 'normal' ? null : s.vision)
  set('data-font', s.fontLarge ? 'large' : null)
  set('data-reading', s.easyRead ? 'easy' : null)
}
