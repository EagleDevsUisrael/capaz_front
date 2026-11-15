import { delay, http, HttpResponse } from 'msw'
import { filterJobs } from '@/features/jobs/filterJobs'
import type { AccessibilityFilter, Job, JobFilters, SalaryRange, Stats, Workday } from '@/features/jobs/types'
import jobsData from './jobs.json'

// Catálogo de prueba. El admin (/admin/jobs) agregará aquí en memoria.
const jobs = jobsData as Job[]

const list = <T extends string>(v: string | null) => (v ? (v.split(',').filter(Boolean) as T[]) : [])

/** API simulada (MSW). Cuando el backend esté listo se desactiva con VITE_API_MOCKS=false. */
export const handlers = [
  http.get('/api/jobs', async ({ request }) => {
    const p = new URL(request.url).searchParams
    const filters: JobFilters = {
      q: p.get('q') ?? '',
      city: p.get('city') ?? '',
      accessibility: list<AccessibilityFilter>(p.get('accessibility')),
      workday: list<Workday>(p.get('workday')),
      salary: (p.get('salary') as SalaryRange | null) ?? null,
    }
    await delay(250)
    return HttpResponse.json(filterJobs(jobs, filters))
  }),

  http.get('/api/jobs/:id', async ({ params }) => {
    await delay(150)
    const job = jobs.find((j) => j.id === params.id)
    return job ? HttpResponse.json(job) : HttpResponse.json({ message: 'No encontrada' }, { status: 404 })
  }),

  http.get('/api/stats', () => {
    const stats: Stats = {
      activeJobs: jobs.length,
      provinces: new Set(jobs.map((j) => j.province).filter((p) => p !== 'Nacional')).size,
      legalQuota: 4,
    }
    return HttpResponse.json(stats)
  }),

  http.post('/api/applications', async ({ request }) => {
    const { jobId } = (await request.json()) as { jobId: string }
    await delay(300)
    return HttpResponse.json({ id: `app-${jobId}-${Date.now().toString(36)}` }, { status: 201 })
  }),
]
