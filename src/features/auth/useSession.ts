import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SessionState {
  signedIn: boolean
  /** Token que devuelven POST /signup y POST /auth/verify; se manda como Authorization: Bearer */
  token: string | null
  signIn: (token?: string) => void
  signOut: () => void
}

/**
 * Sesión. TODO(backend): el registro (paso 1 con OCR) y el ingreso (/login) aún no llaman al backend:
 * mientras tanto `signIn()` sin token deja una sesión de demostración que solo sirve con los datos de prueba (MSW).
 */
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      signedIn: false,
      token: null,
      signIn: (token) => set({ signedIn: true, token: token ?? null }),
      signOut: () => set({ signedIn: false, token: null }),
    }),
    { name: 'capaz-session' },
  ),
)
