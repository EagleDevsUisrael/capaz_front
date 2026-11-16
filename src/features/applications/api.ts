import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import type { ApplicationStatus, ContactPreference, InterviewMode, Job, Match } from '@/shared/api/types'

/** applicationDto del back (src/modules/dto.ts) */
export interface Application {
  id: string
  status: ApplicationStatus
  statusLabel: string
  /** Etapa 1 a 3 (Enviada · En revisión · Entrevista) */
  stage: number
  matchScore: number | null
  interview: {
    at: string
    mode: InterviewMode | null
    place: string | null
    confirmedAt: string | null
  } | null
  nextSteps?: {
    reviewBusinessDays: number
    reviewBy: string
    contactChannel: ContactPreference
    contactValue: string
  }
  similarCount?: number
  createdAt: string
  updatedAt: string
  job: Job
  events?: { status: ApplicationStatus; statusLabel: string; note: string | null; at: string }[]
}

export const useApplications = () =>
  useQuery({
    queryKey: ['applications'],
    queryFn: () => api<{ items: Application[] }>('/applications').then((r) => r.items),
  })

export const useApplication = (id: string | undefined) =>
  useQuery({
    queryKey: ['applications', id],
    queryFn: () => api<Application>(`/applications/${id}`),
    enabled: !!id,
  })

export const useSimilarJobs = (id: string, enabled: boolean) =>
  useQuery({
    queryKey: ['applications', id, 'similar'],
    queryFn: () => api<{ items: { job: Job; match: Match }[] }>(`/applications/${id}/similar`).then((r) => r.items),
    enabled,
  })

/** Acciones sobre una postulación: confirmar entrevista o retirar */
export function useApplicationAction(action: 'confirm-interview' | 'withdraw') {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<Application>(`/applications/${id}/${action}`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  })
}

/** Fecha legible en español de Ecuador */
export const formatDate = (iso: string, withTime = false) =>
  new Date(iso).toLocaleString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(withTime && { hour: 'numeric', minute: '2-digit' }),
  })
