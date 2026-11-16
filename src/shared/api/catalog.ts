import { useQuery } from '@tanstack/react-query'
import { api } from './client'
import type { Catalog } from './types'

/** Catálogo del back (listas y etiquetas). Cambia muy poco: se pide una vez por sesión. */
export const useCatalog = () =>
  useQuery({ queryKey: ['catalog'], queryFn: () => api<Catalog>('/catalog'), staleTime: Infinity })

/** Etiqueta de un código, o el código si no está en la lista */
export const labelIn = (list: { value: string; label: string }[] | undefined, value: string | null | undefined) =>
  list?.find((o) => o.value === value)?.label ?? value ?? ''
