import type { DisabilityType, Job, JobFeature, JobIcon, Modality, SalaryRange, Schedule } from './types'

export const MODALITY_LABEL: Record<Modality, string> = { remote: 'Teletrabajo', hybrid: 'Híbrido', onSite: 'Presencial' }
export const SCHEDULE_LABEL: Record<Schedule, string> = { fullTime: 'Tiempo completo', partTime: 'Medio tiempo', internship: 'Pasantía' }
export const SCHEDULES = Object.keys(SCHEDULE_LABEL) as Schedule[]

export const DISABILITY_LABEL: Record<DisabilityType, string> = {
  physical: 'Discapacidad física',
  visual: 'Discapacidad visual',
  hearing: 'Discapacidad auditiva',
  intellectual: 'Discapacidad intelectual',
  psychosocial: 'Discapacidad psicosocial',
}

/** Casillas de "Accesibilidad del puesto" (textos del mockup; códigos del back) */
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

/** "$470 – $600", "$800" o "A convenir" */
export function salaryLabel(j: Pick<Job, 'salaryMin' | 'salaryMax'>): string {
  const { salaryMin: min, salaryMax: max } = j
  if (min != null && max != null) return min === max ? money(min) : `${money(min)} – ${money(max)}`
  if (min != null) return `Desde ${money(min)}`
  if (max != null) return `Hasta ${money(max)}`
  return 'A convenir'
}

export const daysSince = (iso: string) => Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 86_400_000))

export function postedLabel(createdAt: string): string {
  const days = daysSince(createdAt)
  if (days === 0) return 'Publicada hoy'
  if (days === 1) return 'Publicada ayer'
  return `Publicada hace ${days} días`
}

/** Etiquetas cortas de la tarjeta, de lo más importante a lo menos (máximo 3) */
export function jobTags(job: Job): string[] {
  const tags: string[] = []
  const a = job.accommodationsOffered
  if (job.modality === 'remote') tags.push('Teletrabajo')
  if (a.includes('screenReader')) tags.push('Lector de pantalla')
  if (a.includes('ramp')) tags.push('Silla de ruedas')
  if (a.includes('signLanguage')) tags.push('Lengua de señas')
  if (a.includes('flexibleSchedule')) tags.push('Horario flexible')
  return tags.slice(0, 3)
}

/** "Banco del Litoral · Guayaquil · Teletrabajo" */
export const jobSubtitle = (j: Job) =>
  [j.company, j.city && j.city !== 'Todo el país' ? j.city : null, MODALITY_LABEL[j.modality]].filter(Boolean).join(' · ')

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** El back no guarda icono: se deduce de palabras clave y título */
const ICON_RULES: [JobIcon, RegExp][] = [
  ['headset', /call|atencion|cliente|telefon|soporte|recepcion/],
  ['chart', /contab|analis|dato|excel|finanz|auxiliar/],
  ['audio', /audio|transcrip|locu|sonido|radio/],
  ['shield', /segur|guardia|vigil|calidad/],
  ['monitor', /digit|program|sistema|web|diseno|informat|computa/],
  ['home', /casa|limpieza|cocina|hogar/],
]
export function iconFor(job: Pick<Job, 'title' | 'keywords'>): JobIcon {
  const text = normalize([job.title, ...job.keywords].join(' '))
  return ICON_RULES.find(([, re]) => re.test(text))?.[0] ?? 'briefcase'
}
