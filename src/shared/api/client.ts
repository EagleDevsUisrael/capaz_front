import { useSession } from '@/features/auth/useSession'

/**
 * Cliente de la API de capaz_backend. Todas las rutas van bajo /api (documento y README del backend).
 * - Con VITE_API_URL (p. ej. http://localhost:3000/api) habla con el backend real.
 * - Sin ella usa la ruta relativa /api, que atiende MSW (datos de prueba) o un proxy.
 * Errores: el backend siempre responde { error: { code, message, fields? } }; `message` ya está en español.
 */
const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '/api'

export class ApiError extends Error {
  status: number
  code: string
  fields?: Record<string, string>
  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown; query?: URLSearchParams } = {}): Promise<T> {
  const token = useSession.getState().token
  const qs = init.query?.toString()
  let res: Response
  try {
    res = await fetch(`${BASE}${path}${qs ? `?${qs}` : ''}`, {
      method: init.method ?? 'GET',
      headers: {
        ...(init.body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'NETWORK', 'No hay conexión con Capaz. Revisa tu internet e inténtalo otra vez.')
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: { code: string; message: string; fields?: Record<string, string> } } | null
    // Sesión vencida: se cierra para que la persona vuelva a ingresar
    if (res.status === 401 && token) useSession.getState().signOut()
    throw new ApiError(res.status, data?.error?.code ?? 'ERROR', data?.error?.message ?? 'Algo salió mal. Inténtalo otra vez.', data?.error?.fields)
  }
  return res.json() as Promise<T>
}
