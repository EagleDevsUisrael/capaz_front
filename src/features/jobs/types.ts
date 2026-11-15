import type { Accommodation } from '@/features/signup/options'

export type Modality = 'remote' | 'hybrid' | 'onsite'
export type Workday = 'fullTime' | 'partTime' | 'internship'
export type DisabilityType = 'physical' | 'visual' | 'hearing' | 'intellectual' | 'psychosocial'
/** Exigencias físicas del puesto (las usa el motor de match para descartar ofertas) */
export type PhysicalDemand = 'bothHands' | 'standing' | 'walkingDriving' | 'seeScreen' | 'phoneSpeaking' | 'hearing'
export type JobIcon = 'headset' | 'chart' | 'audio' | 'shield' | 'briefcase' | 'monitor' | 'home'
/** Pictogramas de la versión Lectura fácil */
export type PictoName = 'phone' | 'help' | 'home' | 'calendar' | 'clock' | 'money' | 'computer' | 'school' | 'check'

export interface EasyReadSection {
  heading: string
  lines: { icon: PictoName; text: string }[]
}

/** Texto escrito a mano por el admin (documento: campo `easyReadSummary`). Sin generar al vuelo. */
export interface EasyReadSummary {
  title: string
  company: string
  sections: EasyReadSection[]
}

export interface Job {
  id: string
  title: string
  company: string
  city: string
  province: string
  modality: Modality
  workday: Workday
  /** Salario mensual en dólares */
  salary: number
  postedDaysAgo: number
  hoursPerDay: number
  icon: JobIcon
  /** Texto corto de la tarjeta */
  summary: string
  /** "Qué harás" */
  tasks: string
  /** Ajustes que ofrece la empresa, en lenguaje sencillo */
  offered: string[]
  requirements: string[]
  benefits: string
  /** Códigos que usa el match (mismos que los ajustes que pide la persona) */
  accommodationsOffered: Accommodation[]
  compatibleDisabilities: DisabilityType[]
  physicalDemands: PhysicalDemand[]
  keywords: string[]
  easyReadSummary?: EasyReadSummary
}

/** Filtros "Accesibilidad del puesto". 'remote' sale de la modalidad; los demás, de accommodationsOffered. */
export type AccessibilityFilter = 'remote' | 'ramp' | 'screenReader' | 'signLanguage' | 'flexibleSchedule'
export type SalaryRange = '470-600' | '600-900' | '900+'

export interface JobFilters {
  /** "¿Qué trabajo buscas?" */
  q: string
  /** "¿En qué ciudad?" ("teletrabajo" muestra las remotas) */
  city: string
  accessibility: AccessibilityFilter[]
  workday: Workday[]
  salary: SalaryRange | null
}

export const EMPTY_FILTERS: JobFilters = { q: '', city: '', accessibility: [], workday: [], salary: null }

export interface JobsResponse {
  jobs: Job[]
  total: number
  /** Cuántas ofertas tiene cada filtro de accesibilidad (sobre todo el catálogo) */
  counts: Record<AccessibilityFilter, number>
}

export interface Stats {
  activeJobs: number
  provinces: number
  /** Cuota legal de contratación de personas con discapacidad (%) */
  legalQuota: number
}
