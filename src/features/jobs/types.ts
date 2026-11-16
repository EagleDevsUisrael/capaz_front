/** Forma de las ofertas = jobDto del backend (capaz_backend/src/modules/dto.ts). Códigos en inglés, igual que el catálogo. */
import type { Accommodation, EducationLevel } from '@/features/signup/options'

export type Modality = 'remote' | 'hybrid' | 'onSite'
export type Schedule = 'fullTime' | 'partTime' | 'internship'
export type DisabilityType = 'physical' | 'visual' | 'hearing' | 'intellectual' | 'psychosocial'
export type PhysicalDemand = 'bothHands' | 'standing' | 'walkingDriving' | 'seeScreen' | 'phoneSpeaking' | 'hearing'
export type JobIconName = 'headset' | 'chart' | 'audio' | 'shield' | 'briefcase' | 'monitor' | 'home'

/** Lectura fácil por secciones: frases cortas, una idea por línea. null si el admin no la escribió. */
export interface EasyRead {
  jobTitle: string
  whatYouDo: string[]
  whereAndWhen: string[]
  pay: string[]
  whatYouGet: string[]
  whatYouNeed: string[]
}

export interface Job {
  id: string
  title: string
  company: string
  city: string
  /** null = todo el país (teletrabajo) */
  province: string | null
  modality: Modality
  schedule: Schedule
  dailyHours: number | null
  salaryMin: number | null
  salaryMax: number | null
  /** Tarjeta de la lista */
  summary: string
  /** "Qué harás" */
  description: string
  /** "Qué necesitas" */
  requirements: string[]
  /** "Ajustes que ofrece la empresa" */
  accommodationsDetail: string[]
  /** "Salario y beneficios" */
  salaryBenefits: string
  easyRead: EasyRead | null
  compatibleDisabilities: DisabilityType[]
  physicalDemands: PhysicalDemand[]
  accommodationsOffered: Accommodation[]
  keywords: string[]
  minEducation: EducationLevel | null
  isActive: boolean
  createdAt: string
}

/** Resultado del motor de match (solo llega con sesión). */
export interface Match {
  jobId: string
  score: number
  recommended: boolean
  rejected: boolean
  rejectReason: string | null
  reasons: string[]
  warnings: string[]
}

export type JobItem = Job & { match: Match | null }

/** Filtros "Accesibilidad del puesto" = `features` del backend. La oferta debe cumplir TODOS los marcados. */
export type JobFeature = 'remote' | 'wheelchair' | 'screenReader' | 'signLanguage' | 'flexibleSchedule'
export type SalaryRange = '470-600' | '600-900' | '900+'

export interface JobFilters {
  /** "¿Qué trabajo buscas?" */
  q: string
  /** "¿En qué ciudad?" (acepta "teletrabajo") */
  where: string
  features: JobFeature[]
  schedule: Schedule[]
  salary: SalaryRange | null
}

export const EMPTY_FILTERS: JobFilters = { q: '', where: '', features: [], schedule: [], salary: null }

export interface JobsResponse {
  total: number
  page: number
  pageSize: number
  sort: 'compatibility' | 'recent'
  /** Cuántas ofertas habría al marcar cada filtro, sumado a lo ya elegido */
  facets: {
    features: Record<JobFeature, number>
    salary: Record<SalaryRange, number>
    schedule: Record<Schedule, number>
  }
  items: JobItem[]
}

export interface Stats {
  activeJobs: number
  remoteJobs: number
  provinces: number
}
