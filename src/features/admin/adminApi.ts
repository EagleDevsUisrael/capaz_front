/**
 * Llamadas al admin de capaz_backend (/api/admin/*). Siempre con el ADMIN_TOKEN guardado en
 * sessionStorage (nunca en el código ni en variables de entorno), nunca con el token de sesión.
 */
import { api } from '@/shared/api/client'
import type {
  Accommodation,
  ApplicationStatus,
  DisabilityType,
  EasyRead,
  EducationLevel,
  InterviewMode,
  Job,
  Match,
  Modality,
  PhysicalDemand,
  Schedule,
  Skill,
} from '@/shared/api/types'

const KEY = 'capaz.adminToken'

export const adminTokenStore = {
  get: (): string | null => {
    try {
      return sessionStorage.getItem(KEY)
    } catch {
      return null
    }
  },
  set: (t: string) => {
    try {
      sessionStorage.setItem(KEY, t)
    } catch {
      /* sin almacenamiento: solo dura en memoria */
    }
  },
  clear: () => {
    try {
      sessionStorage.removeItem(KEY)
    } catch {
      /* nada */
    }
  },
}

export type AdminJob = Job & { isDemo: boolean }

/** Cuerpo de POST/PUT /api/admin/jobs (jobInput del back) */
export interface JobInput {
  title: string
  company: string
  city: string
  modality: Modality
  schedule: Schedule
  salaryMin: number | null
  salaryMax: number | null
  province: string | null
  dailyHours: number | null
  summary: string
  description: string
  requirements: string[]
  accommodationsDetail: string[]
  salaryBenefits: string
  easyRead: EasyRead | null
  compatibleDisabilities: DisabilityType[]
  physicalDemands: PhysicalDemand[]
  accommodationsOffered: Accommodation[]
  keywords: string[]
  minEducation: EducationLevel | null
  isActive: boolean
}

/** Candidato para el motor de match (matchCandidate del back) */
export interface MatchCandidate {
  disabilityType: DisabilityType
  disabilityPercent: number
  city: string | null
  experienceText: string
  education: EducationLevel | null
  skills: Skill[]
  accommodationsNeeded: Accommodation[]
  otherAccommodation: string
}

export type TestCandidate = MatchCandidate & { id: string; fullName: string }

export interface RankedItem {
  job: { id: string; title: string; company: string }
  match: Match
}

export interface AdminApplication {
  id: string
  status: ApplicationStatus
  statusLabel: string
  matchScore: number | null
  interview: { at: string; mode: InterviewMode | null; place: string | null; confirmedAt: string | null } | null
  createdAt: string
  updatedAt: string
  job: Job
}

export interface ApplicationPatch {
  status: Exclude<ApplicationStatus, 'withdrawn'>
  interviewAt?: string | null
  interviewMode?: InterviewMode | null
  interviewPlace?: string | null
  note?: string
}

export function adminApi(token: string) {
  const o = { token }
  return {
    jobs: () => api<{ items: AdminJob[] }>('/admin/jobs', o),
    createJob: (body: JobInput) => api<Job>('/admin/jobs', { ...o, method: 'POST', body }),
    updateJob: (id: string, body: JobInput) => api<Job>(`/admin/jobs/${id}`, { ...o, method: 'PUT', body }),
    deleteJob: (id: string) => api<void>(`/admin/jobs/${id}`, { ...o, method: 'DELETE' }),
    randomJobs: (count = 10) => api<{ items: Job[] }>('/admin/jobs/random', { ...o, method: 'POST', body: { count } }),
    easyReadDraft: (id: string) =>
      api<{ easyRead: EasyRead; provider: string }>(`/admin/jobs/${id}/easy-read-draft`, { ...o, method: 'POST' }),
    match: (candidate: MatchCandidate) =>
      api<{ items: RankedItem[] }>('/admin/match', { ...o, method: 'POST', body: { candidate } }),
    candidates: () => api<{ items: TestCandidate[] }>('/admin/candidates', o),
    randomCandidates: (count = 5) =>
      api<{ count: number }>('/admin/candidates/random', { ...o, method: 'POST', body: { count } }),
    candidateMatches: (id: string) => api<{ items: RankedItem[] }>(`/admin/candidates/${id}/matches`, o),
    applications: () => api<{ items: AdminApplication[] }>('/admin/applications', o),
    patchApplication: (id: string, body: ApplicationPatch) =>
      api<AdminApplication>(`/admin/applications/${id}`, { ...o, method: 'PATCH', body }),
  }
}
export type AdminApi = ReturnType<typeof adminApi>
