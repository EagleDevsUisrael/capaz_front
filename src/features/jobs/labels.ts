import type { AccessibilityFilter, DisabilityType, Job, Modality, SalaryRange, Workday } from './types'

export const MODALITY_LABEL: Record<Modality, string> = { remote: 'Teletrabajo', hybrid: 'Híbrido', onsite: 'Presencial' }
export const WORKDAY_LABEL: Record<Workday, string> = { fullTime: 'Tiempo completo', partTime: 'Medio tiempo', internship: 'Pasantía' }
export const WORKDAYS = Object.keys(WORKDAY_LABEL) as Workday[]

export const DISABILITY_LABEL: Record<DisabilityType, string> = {
  physical: 'Discapacidad física',
  visual: 'Discapacidad visual',
  hearing: 'Discapacidad auditiva',
  intellectual: 'Discapacidad intelectual',
  psychosocial: 'Discapacidad psicosocial',
}

/** Casillas de "Accesibilidad del puesto" (textos del mockup) */
export const ACCESS_FILTER_LABEL: Record<AccessibilityFilter, string> = {
  remote: 'Teletrabajo desde casa',
  ramp: 'Acceso en silla de ruedas',
  screenReader: 'Compatible con lector de pantalla',
  signLanguage: 'Equipo con lengua de señas',
  flexibleSchedule: 'Horario flexible',
}

export const SALARY_OPTIONS: { value: SalaryRange; label: string }[] = [
  { value: '470-600', label: '$470 – $600' },
  { value: '600-900', label: '$600 – $900' },
  { value: '900+', label: 'Más de $900' },
]

export const money = (n: number) => `$${n.toLocaleString('es-EC')}`

export function postedLabel(days: number): string {
  if (days <= 0) return 'Publicada hoy'
  if (days === 1) return 'Publicada ayer'
  return `Publicada hace ${days} días`
}

/** Etiquetas cortas de la tarjeta, de lo más importante a lo menos (máximo 3) */
export function jobTags(job: Job): string[] {
  const tags: string[] = []
  if (job.modality === 'remote') tags.push('Teletrabajo')
  if (job.accommodationsOffered.includes('screenReader')) tags.push('Lector de pantalla')
  if (job.accommodationsOffered.includes('ramp')) tags.push('Silla de ruedas')
  if (job.accommodationsOffered.includes('signLanguage')) tags.push('Lengua de señas')
  if (job.accommodationsOffered.includes('flexibleSchedule')) tags.push('Horario flexible')
  return tags.slice(0, 3)
}

/** "Banco del Litoral · Guayaquil · Teletrabajo" */
export const jobSubtitle = (j: Job) =>
  [j.company, j.city !== 'Todo el país' ? j.city : null, MODALITY_LABEL[j.modality]].filter(Boolean).join(' · ')
