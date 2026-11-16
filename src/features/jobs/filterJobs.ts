import type { AccessibilityFilter, Job, JobFilters, JobsResponse, SalaryRange } from './types'

/** Minúsculas y sin tildes: "Atención" coincide con "atencion". */
export const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

const FEATURE_CHECKS: Record<AccessibilityFilter, (j: Job) => boolean> = {
  remote: (j) => j.modality === 'remote',
  ramp: (j) => j.accommodationsOffered.includes('ramp'),
  screenReader: (j) => j.accommodationsOffered.includes('screenReader'),
  signLanguage: (j) => j.accommodationsOffered.includes('signLanguage'),
  flexibleSchedule: (j) => j.accommodationsOffered.includes('flexibleSchedule'),
}

export const ACCESSIBILITY_FILTERS = Object.keys(FEATURE_CHECKS) as AccessibilityFilter[]

const SALARY_CHECKS: Record<SalaryRange, (n: number) => boolean> = {
  '470-600': (n) => n >= 470 && n <= 600,
  '600-900': (n) => n > 600 && n <= 900,
  '900+': (n) => n > 900,
}

function matchesText(job: Job, q: string): boolean {
  const tokens = normalize(q).split(/\s+/).filter((t) => t.length > 2)
  if (tokens.length === 0) return true
  const haystack = normalize(
    [job.title, job.company, job.summary, job.tasks, ...job.keywords].join(' '),
  )
  return tokens.every((t) => haystack.includes(t))
}

function matchesCity(job: Job, city: string): boolean {
  const c = normalize(city)
  if (!c) return true
  if (c.includes('teletrabajo') || c.includes('remot') || c.includes('casa')) return job.modality === 'remote'
  // Las ofertas de "todo el país" sirven para cualquier ciudad
  if (job.province === 'Nacional') return true
  return normalize(`${job.city} ${job.province}`).includes(c)
}

/**
 * Filtra el catálogo. Dentro de "Accesibilidad del puesto" y "Jornada" las opciones se SUMAN (o):
 * "Mostrando ofertas con teletrabajo o acceso en silla de ruedas". Entre grupos se exige que cumplan todos (y).
 * Orden: las más recientes primero (sin sesión no hay "más compatibles"; eso llega con el match al ingresar).
 */
export function filterJobs(all: Job[], f: JobFilters): JobsResponse {
  const jobs = all
    .filter((j) => matchesText(j, f.q))
    .filter((j) => matchesCity(j, f.city))
    .filter((j) => f.accessibility.length === 0 || f.accessibility.some((a) => FEATURE_CHECKS[a](j)))
    .filter((j) => f.workday.length === 0 || f.workday.includes(j.workday))
    .filter((j) => !f.salary || SALARY_CHECKS[f.salary](j.salary))
    .sort((a, b) => a.postedDaysAgo - b.postedDaysAgo)

  const counts = Object.fromEntries(
    ACCESSIBILITY_FILTERS.map((a) => [a, all.filter(FEATURE_CHECKS[a]).length]),
  ) as JobsResponse['counts']

  return { jobs, total: jobs.length, counts }
}
