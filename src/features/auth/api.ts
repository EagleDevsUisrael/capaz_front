import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import type { Profile, Session } from '@/shared/api/types'
import { useSession } from './useSession'

/** Respuesta de POST /api/auth/code (202). devCode solo existe en desarrollo. */
export interface CodeResponse {
  message: string
  resendAfterSeconds: number
  devCode?: string
}

export type CodeChannel = 'whatsapp' | 'sms'

export const requestLoginCode = (idNumber: string, channel?: CodeChannel) =>
  api<CodeResponse>('/auth/code', { method: 'POST', body: { idNumber, ...(channel && { channel }) } })

export const verifyLoginCode = (idNumber: string, code: string) =>
  api<Session & { candidate: Profile }>('/auth/verify', { method: 'POST', body: { idNumber, code } })

/** Perfil de la persona (GET /api/me). Actualiza el perfil guardado en la sesión. */
export function useMe() {
  const signedIn = useSession((s) => s.signedIn)
  return useQuery({
    queryKey: ['me'],
    enabled: signedIn,
    queryFn: async () => {
      const p = await api<Profile>('/me')
      useSession.getState().setProfile(p)
      return p
    },
  })
}

/** Cierra la sesión en el back y en el navegador (aunque el back falle). */
export async function logout() {
  try {
    await api<void>('/auth/logout', { method: 'POST' })
  } catch {
    /* sesión ya vencida o sin red: igual se cierra aquí */
  }
  useSession.getState().signOut()
}

/**
 * Valida una cédula ecuatoriana (10 dígitos, provincia 01–24 o 30, dígito verificador módulo 10).
 */
export function isValidCedula(id: string): boolean {
  if (!/^\d{10}$/.test(id)) return false
  const prov = Number(id.slice(0, 2))
  if (!((prov >= 1 && prov <= 24) || prov === 30)) return false
  if (Number(id[2]) >= 6) return false
  let sum = 0
  for (let i = 0; i < 9; i++) {
    let d = Number(id[i]) * (i % 2 === 0 ? 2 : 1)
    if (d > 9) d -= 9
    sum += d
  }
  return (10 - (sum % 10)) % 10 === Number(id[9])
}
