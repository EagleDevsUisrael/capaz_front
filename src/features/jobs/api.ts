import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/useSession'
import { api } from '@/shared/api/client'
import type { JobDetailResponse, JobFilters, JobListResponse, Stats } from './types'

export type JobSort = 'compatibility' | 'recent'

/** Lista de ofertas. Con sesión el back agrega `match` y puede ordenar por compatibilidad. */
export function useJobs(filters: JobFilters, sort: JobSort) {
  const token = useSession((s) => s.token)
  return useQuery({
    queryKey: ['jobs', filters, sort, Boolean(token)],
    queryFn: ({ signal }) =>
      api<JobListResponse>('/jobs', {
        signal,
        query: {
          q: filters.q.trim(),
          where: filters.where.trim(),
          features: filters.features,
          schedule: filters.schedule,
          salary: filters.salary,
          sort,
          pageSize: 50,
        },
      }),
    // Mientras llega la nueva lista se sigue mostrando la anterior (sin parpadeos)
    placeholderData: keepPreviousData,
  })
}

export function useJob(id: string | undefined) {
  const token = useSession((s) => s.token)
  return useQuery({
    queryKey: ['job', id, Boolean(token)],
    queryFn: ({ signal }) => api<JobDetailResponse>(`/jobs/${id}`, { signal }),
    enabled: Boolean(id),
    retry: false,
  })
}

export const useStats = () => useQuery({ queryKey: ['stats'], queryFn: () => api<Stats>('/stats') })

/** Postular a una oferta (solo con sesión). 409 ALREADY_APPLIED = ya postuló. */
export function useApply() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (jobId: string) => api<{ id: string }>('/applications', { method: 'POST', body: { jobId } }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['job'] })
      qc.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}
