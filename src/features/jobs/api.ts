import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import type { Job, JobFilters, JobsResponse, Match, Stats } from './types'

/** GET /jobs?q&where&features&salary&schedule (README del backend, "Búsqueda y filtros") */
export function jobsQuery(f: JobFilters): URLSearchParams {
  const p = new URLSearchParams()
  if (f.q.trim()) p.set('q', f.q.trim())
  if (f.where.trim()) p.set('where', f.where.trim())
  if (f.features.length) p.set('features', f.features.join(','))
  if (f.schedule.length) p.set('schedule', f.schedule.join(','))
  if (f.salary) p.set('salary', f.salary)
  p.set('pageSize', '100')
  return p
}

export const useJobs = (filters: JobFilters) =>
  useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => api<JobsResponse>('/jobs', { query: jobsQuery(filters) }),
    // Mientras llega la nueva lista se sigue mostrando la anterior (sin parpadeos)
    placeholderData: keepPreviousData,
  })

export const useJob = (id: string | undefined) =>
  useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      return api<{ job: Job; match: Match | null; applicationId: string | null }>(`/jobs/${id}`)
    },
    enabled: Boolean(id),
  })

export const useStats = () => useQuery({ queryKey: ['stats'], queryFn: () => api<Stats>('/stats') })

/** Postular (solo con sesión). Respuesta: la postulación con `nextSteps`. */
export const useApply = () =>
  useMutation({
    mutationFn: (jobId: string) => api<{ id: string }>('/applications', { method: 'POST', body: { jobId } }),
  })
