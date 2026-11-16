import type { Job, JobFeature, JobIconName, Modality, SalaryRange, Schedule } from './types'

export const MODALITY_LABEL: Record<Modality, string> = { remote: 'Teletrabajo', hybrid: 'Híbrido', onSite: 'Presencial' }
export const SCHEDULE_LABEL: Record<Schedule, string> = { fullTime: 'Tiempo completo', partTime: 'Medio tiempo', internship: 'Pasantía' }
export const SCHEDULES = Object.keys(SCHEDULE_LABEL) as Schedule[]

export const DISABILITY_LABEL = {
  physical: 'Discapacidad física',
  visual: 'Discapacidad visual',
  hearing: 'Discapacidad auditiva',
  intellectual: 'Discapacidad intelectual',
  psychosocial: 'Discapacidad psicosocial',
} as const

/** Casillas de "Accesibilidad del puesto" (textos del mockup; mismos códigos que `features` del backend) */
export const FEATURE_LABEL: Record<JobFeature, string> = {
  remote: 'Teletrabajo desde casa',
  wheelchair: 'Acceso en silla de ruedas',
  screenReader: 'Compatible con lector de pantalla',
  signLanguage: 'Equipo con lengua de señas',
  flexibleSchedule: 'Horario flexible',
}
export const FEATURES = Object.keys(FEATURE_LABEL) as JobFeature[]

export const SALARY_OPTIONS: { value: SalaryRange; label: string }[] = [
  { value: '470-600', label: '$470 – $600' },
  { value: '600-900', label: '$600 – $900' },
  { value: '900+', label: 'Más de $900' },
]
export const SALARIES = SALARY_OPTIONS.map((o) => o.value)

export const money = (n: number) => `$${n.toLocaleString('es-EC')}`

/** "$520" · "$1.200 – $1.800" · "A convenir" */
export function salaryText(j: Pick<Job, 'salaryMin' | 'salaryMax'>): string {
  const { salaryMin: a, salaryMax: b } = j
  if (a == null && b == null) return 'A convenir'
  if (a != null && b != null && a !== b) return `${money(a)} – ${money(b)}`
  return money((a ?? b)!)
}

export const daysAgo = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000))

export function postedLabel(iso: string): string {
  const days = daysAgo(iso)
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
  [j.company, j.province ? j.city : null, MODALITY_LABEL[j.modality]].filter(Boolean).join(' · ')

/** El backend no manda icono: se elige por palabras clave de la oferta (solo decoración). */
export function iconFor(j: Job): JobIconName {
  const k = j.keywords.join(' ')
  if (/atencion|telefono|call/.test(k)) return 'headset'
  if (/desarrollador|programacion|computacion|digitacion/.test(k)) return 'monitor'
  if (/ventas|comercial/.test(k)) return 'chart'
  if (/ingles|docente|audio|transcrip/.test(k)) return 'audio'
  return j.modality === 'remote' ? 'home' : 'briefcase'
}
