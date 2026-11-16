import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { ACCESSIBILITY_FILTERS } from './filterJobs'
import { WORKDAYS } from './labels'
import { EMPTY_FILTERS, type JobFilters, type SalaryRange } from './types'

const SALARIES: SalaryRange[] = ['470-600', '600-900', '900+']

const parseList = <T extends string>(raw: string | null, valid: readonly T[]): T[] =>
  (raw?.split(',') ?? []).filter((v): v is T => (valid as readonly string[]).includes(v))

/**
 * Los filtros viven en la URL (?q=…&a=remote,ramp&w=fullTime&s=600-900):
 * se pueden compartir, el botón Atrás los respeta y sobreviven a recargar la página.
 */
export function useJobFilters() {
  const [params, setParams] = useSearchParams()

  const filters = useMemo<JobFilters>(
    () => ({
      q: params.get('q') ?? '',
      city: params.get('city') ?? '',
      accessibility: parseList(params.get('a'), ACCESSIBILITY_FILTERS),
      workday: parseList(params.get('w'), WORKDAYS),
      salary: SALARIES.find((s) => s === params.get('s')) ?? null,
    }),
    [params],
  )

  const setFilters = useCallback(
    (patch: Partial<JobFilters>) => {
      const next = { ...filters, ...patch }
      const p = new URLSearchParams()
      if (next.q.trim()) p.set('q', next.q.trim())
      if (next.city.trim()) p.set('city', next.city.trim())
      if (next.accessibility.length) p.set('a', next.accessibility.join(','))
      if (next.workday.length) p.set('w', next.workday.join(','))
      if (next.salary) p.set('s', next.salary)
      setParams(p, { replace: true, preventScrollReset: true })
    },
    [filters, setParams],
  )

  const clear = useCallback(() => setParams(new URLSearchParams(), { replace: true, preventScrollReset: true }), [setParams])

  /** Cuántos filtros hay activos (no cuenta el texto de búsqueda): "Filtros (2)" */
  const activeCount = filters.accessibility.length + filters.workday.length + (filters.salary ? 1 : 0)
  const hasAny = activeCount > 0 || Boolean(filters.q || filters.city)

  return { filters, setFilters, clear, activeCount, hasAny, defaults: EMPTY_FILTERS }
}
