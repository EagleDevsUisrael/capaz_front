import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile } from '@/shared/api/types'

interface SessionState {
  /** Token de sesión del back (Authorization: Bearer). null = sin sesión */
  token: string | null
  expiresAt: string | null
  /** Perfil de la persona (GET /api/me). Se refresca al entrar. */
  profile: Profile | null
  /** Derivado: hay token vigente */
  signedIn: boolean
  signIn: (s: { token: string; expiresAt: string; profile?: Profile | null }) => void
  setProfile: (p: Profile) => void
  signOut: () => void
}

/**
 * Sesión real: cédula + código de 4 dígitos (POST /api/auth/verify) o al terminar el registro
 * (POST /api/signup). El token se guarda en localStorage para no pedir el código cada vez.
 * Cerrar sesión en el back: POST /api/auth/logout (ver features/auth/api.ts).
 */
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      expiresAt: null,
      profile: null,
      signedIn: false,
      signIn: ({ token, expiresAt, profile }) => set({ token, expiresAt, profile: profile ?? null, signedIn: true }),
      setProfile: (profile) => set({ profile }),
      signOut: () => set({ token: null, expiresAt: null, profile: null, signedIn: false }),
    }),
    {
      name: 'capaz-session',
      version: 2,
      // Sesiones viejas de la demo (solo { signedIn: true }) no tienen token: se descartan
      migrate: () => ({ token: null, expiresAt: null, profile: null, signedIn: false }),
      onRehydrateStorage: () => (s) => {
        if (s?.expiresAt && new Date(s.expiresAt) < new Date()) s.signOut()
      },
    },
  ),
)
