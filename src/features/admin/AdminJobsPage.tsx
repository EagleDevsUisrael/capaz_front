/**
 * Admin — Datos de prueba (/admin/jobs). Todo pasa por /api/admin/* con el ADMIN_TOKEN que escribe
 * el admin (se guarda solo en sessionStorage). Pestañas: Ofertas · Candidatos de prueba · Probar match · Postulaciones.
 */
import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { errorMessage } from '@/shared/api/client'
import { labelIn, useCatalog } from '@/shared/api/catalog'
import type { Catalog, InterviewMode } from '@/shared/api/types'
import { adminApi, adminTokenStore, type AdminApi, type AdminApplication, type AdminJob, type ApplicationPatch, type MatchCandidate, type RankedItem } from './adminApi'
import { JobForm } from './JobForm'
import './admin.css'

const TABS = [
  { id: 'jobs', label: 'Ofertas' },
  { id: 'candidates', label: 'Candidatos de prueba' },
  { id: 'match', label: 'Probar match' },
  { id: 'applications', label: 'Postulaciones' },
] as const
type TabId = (typeof TABS)[number]['id']

const money = (n: number | null) => (n == null ? '' : `$${n}`)

export function AdminJobsPage() {
  const [token, setToken] = useState<string | null>(() => adminTokenStore.get())
  const qc = useQueryClient()
  const { data: catalog } = useCatalog()
  const [tab, setTab] = useState<TabId>('jobs')

  if (!token) return <TokenGate onOk={(t) => { adminTokenStore.set(t); setToken(t) }} />

  const api = adminApi(token)
  const signOut = () => {
    adminTokenStore.clear()
    qc.removeQueries({ queryKey: ['admin'] })
    setToken(null)
  }

  return (
    <div className="adm">
      <div className="adm__head">
        <div>
          <h1>Admin — Datos de prueba</h1>
          <p className="adm__muted">Ofertas, candidatos de prueba y postulaciones para la demo. Nunca muestra personas reales.</p>
        </div>
        <button className="adm__btn" onClick={signOut}>Salir</button>
      </div>
      <div className="adm__tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className="adm__tab" onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {!catalog ? (
        <p>Cargando catálogo…</p>
      ) : (
        <div role="tabpanel">
          {tab === 'jobs' && <JobsTab api={api} token={token} catalog={catalog} />}
          {tab === 'candidates' && <CandidatesTab api={api} token={token} catalog={catalog} />}
          {tab === 'match' && <MatchTab api={api} catalog={catalog} />}
          {tab === 'applications' && <ApplicationsTab api={api} token={token} catalog={catalog} />}
        </div>
      )}
    </div>
  )
}

/** Pide el token y lo valida con GET /api/admin/jobs antes de guardarlo */
function TokenGate({ onOk }: { onOk: (t: string) => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault()
    const t = value.trim()
    if (!t) return
    setBusy(true)
    setError(null)
    try {
      await adminApi(t).jobs()
      onOk(t)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="adm" style={{ maxWidth: 480 }}>
      <h1>Admin — Datos de prueba</h1>
      <form className="adm__card" onSubmit={submit}>
        <label className="adm__f">
          Token de administrador
          <input type="password" autoComplete="off" value={value} onChange={(e) => setValue(e.target.value)} />
          <small>Se guarda solo en esta pestaña del navegador.</small>
        </label>
        {error && <p role="alert" className="adm__error">{error}</p>}
        <button type="submit" className="adm__btn adm__btn--primary" style={{ marginTop: 12 }} disabled={busy}>
          {busy ? 'Validando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

interface TabProps { api: AdminApi; token: string; catalog: Catalog }

// ── Ofertas ──
function JobsTab({ api, token, catalog }: TabProps) {
  const qc = useQueryClient()
  const key = ['admin', token, 'jobs']
  const jobs = useQuery({ queryKey: key, queryFn: api.jobs })
  const [editing, setEditing] = useState<AdminJob | 'new' | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const refresh = () => qc.invalidateQueries({ queryKey: key })

  const random = useMutation({
    mutationFn: () => api.randomJobs(10),
    onSuccess: (r) => { setMsg(`Se crearon ${r.items.length} ofertas.`); refresh() },
  })
  const del = useMutation({
    mutationFn: (id: string) => api.deleteJob(id),
    onSuccess: () => { setMsg('Oferta eliminada.'); refresh() },
  })

  if (editing)
    return (
      <JobForm
        key={editing === 'new' ? 'new' : editing.id}
        api={api}
        catalog={catalog}
        job={editing === 'new' ? null : editing}
        onCancel={() => setEditing(null)}
        onDone={() => { setEditing(null); setMsg('Oferta guardada.'); refresh() }}
      />
    )

  return (
    <section>
      <div className="adm__bar">
        <button className="adm__btn adm__btn--primary" onClick={() => setEditing('new')}>Nueva oferta</button>
        <button className="adm__btn" onClick={() => random.mutate()} disabled={random.isPending}>
          {random.isPending ? 'Generando…' : 'Generar 10 ofertas al azar'}
        </button>
        {msg && <span role="status" className="adm__ok">{msg}</span>}
      </div>
      {(random.error || del.error || jobs.error) && (
        <p role="alert" className="adm__error">{errorMessage(random.error ?? del.error ?? jobs.error)}</p>
      )}
      {jobs.isLoading ? <p>Cargando ofertas…</p> : (
        <div className="adm__table-wrap">
          <table>
            <thead>
              <tr><th>Título</th><th>Empresa</th><th>Ciudad</th><th>Modalidad</th><th>Salario</th><th>Estado</th><th>Origen</th><th /></tr>
            </thead>
            <tbody>
              {jobs.data?.items.map((j) => (
                <tr key={j.id}>
                  <td>{j.title}</td>
                  <td>{j.company}</td>
                  <td>{j.city}</td>
                  <td>{labelIn(catalog.jobModalities, j.modality)}</td>
                  <td>{[money(j.salaryMin), money(j.salaryMax)].filter(Boolean).join(' – ') || '—'}</td>
                  <td><span className={`adm__badge ${j.isActive ? 'adm__badge--ok' : ''}`}>{j.isActive ? 'Activa' : 'Inactiva'}</span></td>
                  <td>{j.isDemo ? <span className="adm__badge adm__badge--demo">Demo</span> : 'Manual'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="adm__btn" onClick={() => setEditing(j)}>Editar</button>{' '}
                    <button
                      className="adm__btn adm__btn--danger"
                      disabled={del.isPending}
                      onClick={() => { if (window.confirm(`¿Eliminar la oferta "${j.title}"? No se puede deshacer.`)) del.mutate(j.id) }}
                    >Eliminar</button>
                  </td>
                </tr>
              ))}
              {jobs.data?.items.length === 0 && <tr><td colSpan={8} className="adm__muted">No hay ofertas todavía.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// ── Resultados de match (compartido) ──
function Ranked({ items }: { items: RankedItem[] }) {
  if (items.length === 0) return <p className="adm__muted">No hay ofertas activas para comparar.</p>
  return (
    <div className="adm__table-wrap">
      <table>
        <thead><tr><th>#</th><th>Oferta</th><th>Puntaje</th><th>Por qué encaja</th><th>Avisos</th></tr></thead>
        <tbody>
          {items.map(({ job, match }, i) => (
            <tr key={job.id}>
              <td>{i + 1}</td>
              <td><strong>{job.title}</strong><br /><span className="adm__muted">{job.company}</span></td>
              <td>
                <span className="adm__score">{match.score}</span>
                {match.recommended && <> <span className="adm__badge adm__badge--ok">Recomendada</span></>}
                {match.rejected && <><br /><span className="adm__error">Descartada: {match.rejectReason}</span></>}
                <br /><small className="adm__muted">
                  Disc. {match.breakdown.disability} · Ajustes {match.breakdown.accommodations} · Exp. {match.breakdown.experience} · Educ. {match.breakdown.education}
                </small>
              </td>
              <td><ul className="adm__list">{match.reasons.map((r) => <li key={r}>{r}</li>)}</ul></td>
              <td><ul className="adm__list">{match.warnings.map((w) => <li key={w}>{w}</li>)}</ul></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Candidatos de prueba ──
function CandidatesTab({ api, token, catalog }: TabProps) {
  const qc = useQueryClient()
  const key = ['admin', token, 'candidates']
  const list = useQuery({ queryKey: key, queryFn: api.candidates })
  const [selected, setSelected] = useState<string | null>(null)
  const matches = useQuery({
    queryKey: ['admin', token, 'candidate-matches', selected],
    queryFn: () => api.candidateMatches(selected!),
    enabled: !!selected,
  })
  const random = useMutation({
    mutationFn: () => api.randomCandidates(5),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })
  return (
    <section>
      <div className="adm__bar">
        <button className="adm__btn adm__btn--primary" onClick={() => random.mutate()} disabled={random.isPending}>
          {random.isPending ? 'Generando…' : 'Generar 5 candidatos al azar'}
        </button>
        {random.data && <span role="status" className="adm__ok">Se crearon {random.data.count} candidatos.</span>}
      </div>
      {(list.error || random.error) && <p role="alert" className="adm__error">{errorMessage(list.error ?? random.error)}</p>}
      <div className="adm__table-wrap">
        <table>
          <thead><tr><th>Nombre</th><th>Discapacidad</th><th>Ciudad</th><th>Educación</th><th>Ajustes que necesita</th><th /></tr></thead>
          <tbody>
            {list.data?.items.map((c) => (
              <tr key={c.id} className={selected === c.id ? 'is-selected' : ''}>
                <td>{c.fullName}</td>
                <td>{labelIn(catalog.disabilityTypes, c.disabilityType)} {c.disabilityPercent}%</td>
                <td>{c.city ?? '—'}</td>
                <td>{labelIn(catalog.educationLevels, c.education) || '—'}</td>
                <td>{c.accommodationsNeeded.map((a) => labelIn(catalog.accommodations, a)).join(', ') || '—'}</td>
                <td><button className="adm__btn" onClick={() => setSelected(c.id)}>Ver matches</button></td>
              </tr>
            ))}
            {list.data?.items.length === 0 && <tr><td colSpan={6} className="adm__muted">No hay candidatos de prueba. Genera algunos.</td></tr>}
          </tbody>
        </table>
      </div>
      {selected && (
        <>
          <h2>Matches del candidato</h2>
          {matches.isLoading ? <p>Calculando…</p> : matches.error ? (
            <p role="alert" className="adm__error">{errorMessage(matches.error)}</p>
          ) : <Ranked items={matches.data?.items ?? []} />}
        </>
      )}
    </section>
  )
}

// ── Probar match ──
function MatchTab({ api, catalog }: { api: AdminApi; catalog: Catalog }) {
  const [c, setC] = useState<MatchCandidate>({
    disabilityType: 'physical',
    disabilityPercent: 40,
    city: '',
    experienceText: '',
    education: null,
    skills: [],
    accommodationsNeeded: [],
    otherAccommodation: '',
  })
  const run = useMutation({ mutationFn: () => api.match({ ...c, city: c.city?.trim() || null }) })
  const set = <K extends keyof MatchCandidate>(k: K, v: MatchCandidate[K]) => setC((p) => ({ ...p, [k]: v }))
  const toggle = <K extends 'skills' | 'accommodationsNeeded'>(k: K, v: string, on: boolean) =>
    set(k, (on ? [...c[k], v] : c[k].filter((x) => x !== v)) as MatchCandidate[K])

  return (
    <section>
      <form className="adm__card" onSubmit={(e) => { e.preventDefault(); run.mutate() }}>
        <div className="adm__grid">
          <label className="adm__f">
            Tipo de discapacidad
            <select value={c.disabilityType} onChange={(e) => set('disabilityType', e.target.value as MatchCandidate['disabilityType'])}>
              {catalog.disabilityTypes.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="adm__f">
            Porcentaje
            <input type="number" min={1} max={100} value={c.disabilityPercent} onChange={(e) => set('disabilityPercent', Math.min(100, Math.max(1, Number(e.target.value) || 1)))} />
          </label>
          <label className="adm__f">
            Ciudad
            <input value={c.city ?? ''} maxLength={80} onChange={(e) => set('city', e.target.value)} />
          </label>
          <label className="adm__f">
            Educación
            <select value={c.education ?? ''} onChange={(e) => set('education', (e.target.value || null) as MatchCandidate['education'])}>
              <option value="">Sin dato</option>
              {catalog.educationLevels.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>
        <label className="adm__f" style={{ marginTop: 12 }}>
          Experiencia
          <textarea maxLength={4000} value={c.experienceText} onChange={(e) => set('experienceText', e.target.value)} />
        </label>
        <fieldset>
          <legend>Habilidades</legend>
          <div className="adm__checks">
            {catalog.skills.map((o) => (
              <label key={o.value}><input type="checkbox" checked={c.skills.includes(o.value)} onChange={(e) => toggle('skills', o.value, e.target.checked)} />{o.label}</label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Ajustes que necesita</legend>
          <div className="adm__checks">
            {catalog.accommodations.map((o) => (
              <label key={o.value}><input type="checkbox" checked={c.accommodationsNeeded.includes(o.value)} onChange={(e) => toggle('accommodationsNeeded', o.value, e.target.checked)} />{o.label}</label>
            ))}
          </div>
        </fieldset>
        <label className="adm__f" style={{ marginTop: 12 }}>
          Otro ajuste
          <input maxLength={500} value={c.otherAccommodation} onChange={(e) => set('otherAccommodation', e.target.value)} />
        </label>
        <button type="submit" className="adm__btn adm__btn--primary" style={{ marginTop: 12 }} disabled={run.isPending}>
          {run.isPending ? 'Calculando…' : 'Probar match'}
        </button>
      </form>
      {run.error && <p role="alert" className="adm__error">{errorMessage(run.error)}</p>}
      {run.data && <Ranked items={run.data.items} />}
    </section>
  )
}

// ── Postulaciones ──
function ApplicationsTab({ api, token, catalog }: TabProps) {
  const key = ['admin', token, 'applications']
  const list = useQuery({ queryKey: key, queryFn: api.applications })
  return (
    <section>
      {list.error && <p role="alert" className="adm__error">{errorMessage(list.error)}</p>}
      {list.isLoading ? <p>Cargando postulaciones…</p> : (
        <div className="adm__table-wrap">
          <table>
            <thead><tr><th>Oferta</th><th>Estado</th><th>Entrevista</th><th>Actualizada</th><th>Mover a</th></tr></thead>
            <tbody>
              {list.data?.items.map((a) => <ApplicationRow key={a.id} a={a} api={api} queryKey={key} catalog={catalog} />)}
              {list.data?.items.length === 0 && <tr><td colSpan={5} className="adm__muted">No hay postulaciones todavía.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

/** ISO → valor de <input type="datetime-local"> en hora local */
const toLocalInput = (iso: string) => {
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function ApplicationRow({ a, api, queryKey, catalog }: { a: AdminApplication; api: AdminApi; queryKey: string[]; catalog: Catalog }) {
  const qc = useQueryClient()
  const [status, setStatus] = useState<ApplicationPatch['status']>(a.status === 'withdrawn' ? 'sent' : a.status)
  const [at, setAt] = useState(a.interview ? toLocalInput(a.interview.at) : '')
  const [mode, setMode] = useState<InterviewMode | ''>(a.interview?.mode ?? '')
  const [place, setPlace] = useState(a.interview?.place ?? '')
  const [note, setNote] = useState('')
  const save = useMutation({
    mutationFn: () => {
      const body: ApplicationPatch = { status, ...(note.trim() && { note: note.trim() }) }
      if (status === 'interview') {
        body.interviewAt = at ? new Date(at).toISOString() : null
        body.interviewMode = mode || null
        body.interviewPlace = place.trim() || null
      }
      return api.patchApplication(a.id, body)
    },
    onSuccess: () => { setNote(''); qc.invalidateQueries({ queryKey }) },
  })
  const statuses = catalog.applicationStatuses.filter((s) => s.value !== 'withdrawn')
  const missingInterview = status === 'interview' && !at
  return (
    <tr>
      <td><strong>{a.job.title}</strong><br /><span className="adm__muted">{a.job.company}</span></td>
      <td>{a.statusLabel}{a.matchScore != null && <><br /><small className="adm__muted">Match {a.matchScore}</small></>}</td>
      <td>
        {a.interview ? (
          <>
            {new Date(a.interview.at).toLocaleString('es-EC')}<br />
            <small className="adm__muted">
              {labelIn(catalog.interviewModes, a.interview.mode)} {a.interview.place && `· ${a.interview.place}`}
              {a.interview.confirmedAt ? ' · Confirmada' : ' · Sin confirmar'}
            </small>
          </>
        ) : '—'}
      </td>
      <td>{new Date(a.updatedAt).toLocaleDateString('es-EC')}</td>
      <td>
        {a.status === 'withdrawn' ? <span className="adm__muted">Retirada por la persona</span> : (
          <div style={{ display: 'grid', gap: 6, minWidth: 240 }}>
            <select aria-label="Nuevo estado" value={status} onChange={(e) => setStatus(e.target.value as ApplicationPatch['status'])}>
              {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {status === 'interview' && (
              <>
                <input aria-label="Fecha y hora de la entrevista" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
                <select aria-label="Modalidad de la entrevista" value={mode} onChange={(e) => setMode(e.target.value as InterviewMode | '')}>
                  <option value="">Modalidad…</option>
                  {catalog.interviewModes.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <input aria-label="Lugar o enlace" placeholder="Lugar o enlace" maxLength={200} value={place} onChange={(e) => setPlace(e.target.value)} />
              </>
            )}
            <input aria-label="Nota (opcional)" placeholder="Nota (opcional)" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
            <button className="adm__btn adm__btn--primary" disabled={save.isPending || missingInterview} onClick={() => save.mutate()}>
              {save.isPending ? 'Guardando…' : 'Guardar'}
            </button>
            {missingInterview && <small className="adm__muted">Pon la fecha de la entrevista.</small>}
            {save.error && <small role="alert" className="adm__error">{errorMessage(save.error)}</small>}
          </div>
        )}
      </td>
    </tr>
  )
}
