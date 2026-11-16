import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SessionState {
  signedIn: boolean
  signIn: () => void
  signOut: () => void
}

/**
 * Sesión de DEMOSTRACIÓN: solo recuerda si la persona "ya ingresó" (al terminar el registro).
 * TODO(backend): reemplazar por la sesión real (cédula + código de 4 dígitos por WhatsApp o SMS).
 */
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      signedIn: false,
      signIn: () => set({ signedIn: true }),
      signOut: () => set({ signedIn: false }),
    }),
    { name: 'capaz-session' },
  ),
)
