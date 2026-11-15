import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import type { Job, JobFilters, JobsResponse, Stats } from './types'

/** Cliente de la API. Con MSW (datos de prueba) responde desde src/mocks; con el backend real, la misma URL. */
async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json() as Promise<T>
}

export function jobsQueryString(f: JobFilters): string {
  const p = new URLSearchParams()
  if (f.q.trim()) p.set('q', f.q.trim())
  if (f.city.trim()) p.set('city', f.city.trim())
  if (f.accessibility.length) p.set('accessibility', f.accessibility.join(','))
  if (f.workday.length) p.set('workday', f.workday.join(','))
  if (f.salary) p.set('salary', f.salary)
  return p.toString()
}

export const useJobs = (filters: JobFilters) =>
  useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => getJson<JobsResponse>(`/api/jobs?${jobsQueryString(filters)}`),
    // Mientras llega la nueva lista se sigue mostrando la anterior (sin parpadeos)
    placeholderData: keepPreviousData,
  })

export const useJob = (id: string | undefined) =>
  useQuery({
    queryKey: ['job', id],
    queryFn: () => getJson<Job>(`/api/jobs/${id}`),
    enabled: Boolean(id),
  })

export const useStats = () => useQuery({ queryKey: ['stats'], queryFn: () => getJson<Stats>('/api/stats') })

/** Postular a una oferta (solo con sesión). */
export const useApply = () =>
  useMutation({
    mutationFn: async (jobId: string) => {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      return res.json() as Promise<{ id: string }>
    },
  })
