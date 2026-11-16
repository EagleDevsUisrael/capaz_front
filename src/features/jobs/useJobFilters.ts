import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { FEATURES, SALARIES, SCHEDULES } from './labels'
import { EMPTY_FILTERS, type JobFilters } from './types'

const parseList = <T extends string>(raw: string | null, valid: readonly T[]): T[] =>
  (raw?.split(',') ?? []).filter((v): v is T => (valid as readonly string[]).includes(v))

/**
 * Los filtros viven en la URL (?q=…&where=…&a=remote,wheelchair&w=fullTime&s=600-900):
 * se pueden compartir, el botón Atrás los respeta y sobreviven a recargar la página.
 */
export function useJobFilters() {
  const [params, setParams] = useSearchParams()

  const filters = useMemo<JobFilters>(
    () => ({
      q: params.get('q') ?? '',
      where: params.get('where') ?? '',
      features: parseList(params.get('a'), FEATURES),
      schedule: parseList(params.get('w'), SCHEDULES),
      salary: SALARIES.find((s) => s === params.get('s')) ?? null,
    }),
    [params],
  )

  const setFilters = useCallback(
    (patch: Partial<JobFilters>) => {
      const next = { ...filters, ...patch }
      const p = new URLSearchParams()
      if (next.q.trim()) p.set('q', next.q.trim())
      if (next.where.trim()) p.set('where', next.where.trim())
      if (next.features.length) p.set('a', next.features.join(','))
      if (next.schedule.length) p.set('w', next.schedule.join(','))
      if (next.salary) p.set('s', next.salary)
      setParams(p, { replace: true, preventScrollReset: true })
    },
    [filters, setParams],
  )

  const clear = useCallback(() => setParams(new URLSearchParams(), { replace: true, preventScrollReset: true }), [setParams])

  /** Cuántos filtros hay activos (no cuenta el texto de búsqueda): "Filtros (2)" */
  const activeCount = filters.features.length + filters.schedule.length + (filters.salary ? 1 : 0)
  const hasAny = activeCount > 0 || Boolean(filters.q || filters.where)

  return { filters, setFilters, clear, activeCount, hasAny, defaults: EMPTY_FILTERS }
}
