/**
 * Cliente de la API de capaz_backend. Todas las pantallas llaman a la API a través de aquí.
 * - En desarrollo, Vite reenvía /api a http://localhost:3000 (vite.config.ts → server.proxy).
 * - En producción, VITE_API_URL apunta al back (vacío = mismo dominio).
 * - Agrega `Authorization: Bearer <token>` si hay sesión. Si el back responde 401, cierra la sesión.
 * - Errores con el formato del back: { error: { code, message, fields? } } → ApiError.
 */
import { useSession } from '@/features/auth/useSession'

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields?: Record<string, string>

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

type Query = Record<string, string | number | boolean | string[] | null | undefined>

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Objeto → JSON. FormData → multipart (el navegador pone el Content-Type). */
  body?: unknown
  query?: Query
  /** Token distinto al de la sesión (p. ej. ADMIN_TOKEN) */
  token?: string | null
  signal?: AbortSignal
}

export function toQueryString(q: Query = {}): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(q)) {
    if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) continue
    p.set(k, Array.isArray(v) ? v.join(',') : String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

export async function apiRaw(path: string, opts: RequestOptions = {}): Promise<Response> {
  const token = opts.token !== undefined ? opts.token : useSession.getState().token
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  let body: BodyInit | undefined
  if (opts.body instanceof FormData) body = opts.body
  else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(opts.body)
  }

  let res: Response
  try {
    res = await fetch(`${BASE}/api${path}${toQueryString(opts.query)}`, {
      method: opts.method ?? (body ? 'POST' : 'GET'),
      headers,
      body,
      signal: opts.signal,
    })
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    throw new ApiError(0, 'NETWORK', 'No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo.')
  }

  if (!res.ok) {
    let code = 'HTTP_' + res.status
    let message = 'Algo salió mal. Inténtalo otra vez en un momento.'
    let fields: Record<string, string> | undefined
    try {
      const j = (await res.json()) as { error?: { code: string; message: string; fields?: Record<string, string> } }
      if (j.error) ({ code, message, fields } = j.error)
    } catch {
      /* respuesta sin JSON */
    }
    // Sesión vencida o revocada (solo si usamos el token de sesión, no el de admin)
    if (res.status === 401 && opts.token === undefined && token) useSession.getState().signOut()
    throw new ApiError(res.status, code, message, fields)
  }
  return res
}

/** Petición que devuelve JSON (o undefined si es 204). */
export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await apiRaw(path, opts)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

/** Mensaje para mostrar a la persona a partir de cualquier error. */
export const errorMessage = (e: unknown) =>
  e instanceof ApiError ? e.message : 'Algo salió mal. Inténtalo otra vez en un momento.'
