/** Tipos de Inicio / Detalle. El contrato vive en src/shared/api/types.ts; aquí solo lo propio de la pantalla. */
export type {
  DisabilityType,
  EasyRead,
  Job,
  JobDetailResponse,
  JobFeature,
  JobListResponse,
  JobWithMatch,
  Match,
  Modality,
  SalaryRange,
  Schedule,
  Stats,
} from '@/shared/api/types'
import type { JobFeature, SalaryRange, Schedule } from '@/shared/api/types'

export type JobIcon = 'headset' | 'chart' | 'audio' | 'shield' | 'briefcase' | 'monitor' | 'home'

export interface JobFilters {
  /** "¿Qué trabajo buscas?" */
  q: string
  /** "¿En qué ciudad?" (el back entiende "teletrabajo") */
  where: string
  features: JobFeature[]
  schedule: Schedule[]
  salary: SalaryRange | null
}

export const EMPTY_FILTERS: JobFilters = { q: '', where: '', features: [], schedule: [], salary: null }

/** Cuota legal de contratación de personas con discapacidad en Ecuador (%): texto fijo del inicio */
export const LEGAL_QUOTA = 4
