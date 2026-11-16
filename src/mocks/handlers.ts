import { delay, http, HttpResponse } from 'msw'
import type { Job, JobFeature, JobFilters, JobsResponse, Match, SalaryRange, Schedule, Stats } from '@/features/jobs/types'
import jobsData from './jobs.json'

/**
 * API simulada (MSW) con la MISMA forma que capaz_backend (README, "Contrato de la API").
 * Los datos salen de las ofertas del seed del backend (src/seed/demoData.ts).
 * Sin backend se usa con VITE_API_MOCKS=true; con el backend real, VITE_API_MOCKS=false y VITE_API_URL.
 */
const DAY = 86_400_000
const jobs: Job[] = (jobsData as Job[]).map((j, i) => ({ ...j, createdAt: new Date(Date.now() - (i * 2 + 1) * DAY).toISOString() }))

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
const REMOTE_WORDS = ['teletrabajo', 'remoto', 'desde casa', 'desde mi casa', 'en casa', 'todo el pais']
const SALARY: Record<SalaryRange, { min: number; max: number | null }> = {
  '470-600': { min: 470, max: 600 },
  '600-900': { min: 600, max: 900 },
  '900+': { min: 900, max: null },
}

const FEATURE_CHECK: Record<JobFeature, (j: Job) => boolean> = {
  remote: (j) => j.modality === 'remote',
  wheelchair: (j) => j.accommodationsOffered.includes('ramp'),
  screenReader: (j) => j.accommodationsOffered.includes('screenReader'),
  signLanguage: (j) => j.accommodationsOffered.includes('signLanguage'),
  flexibleSchedule: (j) => j.accommodationsOffered.includes('flexibleSchedule'),
}

function salaryOk(j: Job, r: SalaryRange) {
  const { min, max } = SALARY[r]
  const top = j.salaryMax ?? j.salaryMin ?? 0
  return (max === null ? top > min : top >= min) && (max === null || (j.salaryMin ?? 0) <= max)
}

/** Igual que jobFilter() del backend: los `features` se suman con "y"; el resto se cruza. */
function filter(f: JobFilters) {
  const words = fold(f.q).split(/\s+/).filter(Boolean)
  return jobs.filter((j) => {
    if (words.length && !words.some((w) => fold([j.title, j.company, j.summary, j.description].join(' ')).includes(w) || j.keywords.includes(w))) return false
    if (f.where) {
      const w = fold(f.where)
      if (REMOTE_WORDS.includes(w)) {
        if (j.modality !== 'remote') return false
      } else if (!(fold(j.city).includes(w) || j.modality === 'remote')) return false
    }
    if (!f.features.every((x) => FEATURE_CHECK[x](j))) return false
    if (f.salary && !salaryOk(j, f.salary)) return false
    if (f.schedule.length && !f.schedule.includes(j.schedule)) return false
    return true
  })
}

const list = <T extends string>(v: string | null) => (v ? (v.split(',').filter(Boolean) as T[]) : [])

function filtersOf(p: URLSearchParams): JobFilters {
  return {
    q: p.get('q') ?? '',
    where: p.get('where') ?? '',
    features: list<JobFeature>(p.get('features')),
    schedule: list<Schedule>(p.get('schedule')),
    salary: (p.get('salary') as SalaryRange | null) ?? null,
  }
}

const hasSession = (req: Request) => req.headers.get('authorization')?.startsWith('Bearer ') ?? false

export const handlers = [
  http.get('/api/jobs', async ({ request }) => {
    const f = filtersOf(new URL(request.url).searchParams)
    const found = filter(f).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const featureCounts = Object.fromEntries(
      (Object.keys(FEATURE_CHECK) as JobFeature[]).map((x) => [x, filter({ ...f, features: [...new Set([...f.features, x])] }).length]),
    ) as JobsResponse['facets']['features']
    const salaryCounts = Object.fromEntries((Object.keys(SALARY) as SalaryRange[]).map((r) => [r, filter({ ...f, salary: r }).length])) as JobsResponse['facets']['salary']
    const scheduleCounts = Object.fromEntries((['fullTime', 'partTime', 'internship'] as Schedule[]).map((s) => [s, filter({ ...f, schedule: [s] }).length])) as JobsResponse['facets']['schedule']
    await delay(200)
    const body: JobsResponse = {
      total: found.length,
      page: 1,
      pageSize: 100,
      sort: 'recent',
      facets: { features: featureCounts, salary: salaryCounts, schedule: scheduleCounts },
      items: found.map((j) => ({ ...j, match: null })),
    }
    return HttpResponse.json(body)
  }),

  http.get('/api/jobs/:id', async ({ params, request }) => {
    await delay(120)
    const job = jobs.find((j) => j.id === params.id)
    if (!job) return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Esta oferta ya no está disponible.' } }, { status: 404 })
    const match: Match | null = hasSession(request)
      ? { jobId: job.id, score: 80, recommended: true, rejected: false, rejectReason: null, reasons: [], warnings: [] }
      : null
    return HttpResponse.json({ job, match, applicationId: null })
  }),

  http.get('/api/stats', () => {
    const stats: Stats = {
      activeJobs: jobs.length,
      remoteJobs: jobs.filter((j) => j.modality === 'remote').length,
      provinces: new Set(jobs.map((j) => j.province).filter(Boolean)).size,
    }
    return HttpResponse.json(stats)
  }),

  http.post('/api/applications', async ({ request }) => {
    const { jobId } = (await request.json()) as { jobId: string }
    await delay(300)
    return HttpResponse.json({ id: `00000000-0000-4000-9000-${Date.now().toString().slice(-12)}`, jobId, status: 'sent' }, { status: 201 })
  }),
]
