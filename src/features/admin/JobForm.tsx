import { useState, type FormEvent } from 'react'
import { ApiError, errorMessage } from '@/shared/api/client'
import type { Catalog, EasyRead, Option } from '@/shared/api/types'
import type { AdminApi, AdminJob, JobInput } from './adminApi'

const EASY_SECTIONS: { key: Exclude<keyof EasyRead, 'jobTitle'>; label: string }[] = [
  { key: 'whatYouDo', label: 'Qué harás' },
  { key: 'whereAndWhen', label: 'Dónde y cuándo' },
  { key: 'pay', label: 'Pago' },
  { key: 'whatYouGet', label: 'Qué recibes' },
  { key: 'whatYouNeed', label: 'Qué necesitas' },
]

/** Estado del formulario: listas como texto (una línea por elemento) y números como texto */
interface FormState {
  title: string
  company: string
  city: string
  modality: string
  schedule: string
  salaryMin: string
  salaryMax: string
  province: string
  dailyHours: string
  summary: string
  description: string
  requirements: string
  accommodationsDetail: string
  salaryBenefits: string
  keywords: string
  minEducation: string
  isActive: boolean
  compatibleDisabilities: string[]
  physicalDemands: string[]
  accommodationsOffered: string[]
  easyTitle: string
  easy: Record<string, string>
}

const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean)
const num = (s: string) => (s.trim() === '' ? null : Math.round(Number(s)))

function toForm(j: AdminJob | null): FormState {
  return {
    title: j?.title ?? '',
    company: j?.company ?? '',
    city: j?.city ?? '',
    modality: j?.modality ?? 'onSite',
    schedule: j?.schedule ?? 'fullTime',
    salaryMin: j?.salaryMin?.toString() ?? '',
    salaryMax: j?.salaryMax?.toString() ?? '',
    province: j?.province ?? '',
    dailyHours: j?.dailyHours?.toString() ?? '',
    summary: j?.summary ?? '',
    description: j?.description ?? '',
    requirements: (j?.requirements ?? []).join('\n'),
    accommodationsDetail: (j?.accommodationsDetail ?? []).join('\n'),
    salaryBenefits: j?.salaryBenefits ?? '',
    keywords: (j?.keywords ?? []).join(', '),
    minEducation: j?.minEducation ?? '',
    isActive: j?.isActive ?? true,
    compatibleDisabilities: j?.compatibleDisabilities ?? [],
    physicalDemands: j?.physicalDemands ?? [],
    accommodationsOffered: j?.accommodationsOffered ?? [],
    ...easyToForm(j?.easyRead ?? null),
  }
}

function easyToForm(e: EasyRead | null) {
  return {
    easyTitle: e?.jobTitle ?? '',
    easy: Object.fromEntries(EASY_SECTIONS.map((s) => [s.key, (e?.[s.key] ?? []).join('\n')])),
  }
}

function toInput(f: FormState): JobInput {
  const hasEasy = f.easyTitle.trim() !== '' || Object.values(f.easy).some((v) => v.trim() !== '')
  return {
    title: f.title.trim(),
    company: f.company.trim(),
    city: f.city.trim(),
    modality: f.modality as JobInput['modality'],
    schedule: f.schedule as JobInput['schedule'],
    salaryMin: num(f.salaryMin),
    salaryMax: num(f.salaryMax),
    province: f.province || null,
    dailyHours: num(f.dailyHours),
    summary: f.summary,
    description: f.description,
    requirements: lines(f.requirements),
    accommodationsDetail: lines(f.accommodationsDetail),
    salaryBenefits: f.salaryBenefits,
    keywords: f.keywords.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean),
    minEducation: (f.minEducation || null) as JobInput['minEducation'],
    isActive: f.isActive,
    compatibleDisabilities: f.compatibleDisabilities as JobInput['compatibleDisabilities'],
    physicalDemands: f.physicalDemands as JobInput['physicalDemands'],
    accommodationsOffered: f.accommodationsOffered as JobInput['accommodationsOffered'],
    easyRead: hasEasy
      ? {
          jobTitle: f.easyTitle.trim(),
          ...(Object.fromEntries(EASY_SECTIONS.map((s) => [s.key, lines(f.easy[s.key] ?? '')])) as Omit<EasyRead, 'jobTitle'>),
        }
      : null,
  }
}

function Checks({ legend, options, value, onChange }: { legend: string; options: Option[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <fieldset>
      <legend>{legend}</legend>
      <div className="adm__checks">
        {options.map((o) => (
          <label key={o.value}>
            <input
              type="checkbox"
              checked={value.includes(o.value)}
              onChange={(e) => onChange(e.target.checked ? [...value, o.value] : value.filter((v) => v !== o.value))}
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

interface Props {
  api: AdminApi
  catalog: Catalog
  /** null = oferta nueva */
  job: AdminJob | null
  onDone: () => void
  onCancel: () => void
}

/** Crear o editar una oferta (jobInput del back) */
export function JobForm({ api, catalog, job, onDone, onCancel }: Props) {
  const [f, setF] = useState<FormState>(() => toForm(job))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [drafting, setDrafting] = useState(false)
  const [draftMsg, setDraftMsg] = useState<string | null>(null)
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }))

  const text = (k: keyof FormState, label: string, props: Record<string, unknown> = {}) => (
    <label className="adm__f">
      {label}
      <input value={f[k] as string} onChange={(e) => set(k, e.target.value as never)} {...props} />
      {fields[k] && <small className="adm__error">{fields[k]}</small>}
    </label>
  )

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (f.compatibleDisabilities.length === 0) {
      setError('Marca al menos un tipo de discapacidad compatible')
      return
    }
    setSaving(true)
    setError(null)
    setFields({})
    try {
      const body = toInput(f)
      if (job) await api.updateJob(job.id, body)
      else await api.createJob(body)
      onDone()
    } catch (err) {
      setError(errorMessage(err))
      if (err instanceof ApiError && err.fields) setFields(err.fields)
    } finally {
      setSaving(false)
    }
  }

  async function draft() {
    if (!job) return
    setDrafting(true)
    setDraftMsg(null)
    try {
      const { easyRead, provider } = await api.easyReadDraft(job.id)
      setF((p) => ({ ...p, ...easyToForm(easyRead) }))
      setDraftMsg(`Borrador generado (${provider}). Revísalo y guarda la oferta para publicarlo.`)
    } catch (err) {
      setDraftMsg(
        err instanceof ApiError && err.status === 503 ? 'La IA no está disponible, escríbela a mano' : errorMessage(err),
      )
    } finally {
      setDrafting(false)
    }
  }

  return (
    <form className="adm__card" onSubmit={submit} noValidate>
      <h2 style={{ marginTop: 0 }}>{job ? `Editar: ${job.title}` : 'Nueva oferta'}</h2>
      <div className="adm__grid">
        {text('title', 'Título', { required: true, maxLength: 120 })}
        {text('company', 'Empresa', { required: true, maxLength: 120 })}
        {text('city', 'Ciudad', { required: true, maxLength: 80 })}
        <label className="adm__f">
          Provincia
          <select value={f.province} onChange={(e) => set('province', e.target.value)}>
            <option value="">Todo el país</option>
            {catalog.provinces.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="adm__f">
          Modalidad
          <select value={f.modality} onChange={(e) => set('modality', e.target.value)}>
            {catalog.jobModalities.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="adm__f">
          Jornada
          <select value={f.schedule} onChange={(e) => set('schedule', e.target.value)}>
            {catalog.jobSchedules.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        {text('dailyHours', 'Horas por día', { type: 'number', min: 1, max: 24 })}
        {text('salaryMin', 'Salario mínimo (USD)', { type: 'number', min: 0 })}
        {text('salaryMax', 'Salario máximo (USD)', { type: 'number', min: 0 })}
        <label className="adm__f">
          Educación mínima
          <select value={f.minEducation} onChange={(e) => set('minEducation', e.target.value)}>
            <option value="">Sin requisito</option>
            {catalog.educationLevels.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        {text('keywords', 'Palabras clave (separadas por coma)')}
        <label className="adm__f" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={f.isActive} onChange={(e) => set('isActive', e.target.checked)} />
          Oferta activa
        </label>
      </div>

      <div className="adm__split" style={{ marginTop: 12 }}>
        <label className="adm__f">
          Resumen (tarjeta)
          <textarea maxLength={300} value={f.summary} onChange={(e) => set('summary', e.target.value)} />
        </label>
        <label className="adm__f">
          Qué harás
          <textarea maxLength={4000} value={f.description} onChange={(e) => set('description', e.target.value)} />
        </label>
        <label className="adm__f">
          Qué necesitas <small>Una línea por requisito</small>
          <textarea value={f.requirements} onChange={(e) => set('requirements', e.target.value)} />
        </label>
        <label className="adm__f">
          Ajustes que ofrece (detalle) <small>Una línea por ajuste</small>
          <textarea value={f.accommodationsDetail} onChange={(e) => set('accommodationsDetail', e.target.value)} />
        </label>
        <label className="adm__f">
          Salario y beneficios
          <textarea maxLength={1000} value={f.salaryBenefits} onChange={(e) => set('salaryBenefits', e.target.value)} />
        </label>
      </div>

      <Checks legend="Discapacidades compatibles (al menos una)" options={catalog.disabilityTypes} value={f.compatibleDisabilities} onChange={(v) => set('compatibleDisabilities', v)} />
      <Checks legend="Lo que exige el puesto" options={catalog.physicalDemands} value={f.physicalDemands} onChange={(v) => set('physicalDemands', v)} />
      <Checks legend="Ajustes que ofrece la empresa" options={catalog.accommodations} value={f.accommodationsOffered} onChange={(v) => set('accommodationsOffered', v)} />

      <fieldset>
        <legend>Lectura fácil</legend>
        {job ? (
          <div className="adm__bar" style={{ marginTop: 8 }}>
            <button type="button" className="adm__btn" onClick={draft} disabled={drafting}>
              {drafting ? 'Generando…' : 'Generar borrador con IA'}
            </button>
            {draftMsg && <span role="status" className="adm__muted">{draftMsg}</span>}
          </div>
        ) : (
          <p className="adm__muted">Guarda la oferta primero para generar un borrador con IA.</p>
        )}
        <div className="adm__split">
          <label className="adm__f">
            Título en lectura fácil
            <input maxLength={80} value={f.easyTitle} onChange={(e) => set('easyTitle', e.target.value)} placeholder="Trabajo: atender llamadas" />
          </label>
          {EASY_SECTIONS.map((s) => (
            <label key={s.key} className="adm__f">
              {s.label} <small>Frases cortas, una por línea (máx. 8)</small>
              <textarea value={f.easy[s.key] ?? ''} onChange={(e) => set('easy', { ...f.easy, [s.key]: e.target.value })} />
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p role="alert" className="adm__error">{error}</p>}
      <div className="adm__bar" style={{ marginTop: 16 }}>
        <button type="submit" className="adm__btn adm__btn--primary" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar oferta'}
        </button>
        <button type="button" className="adm__btn" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  )
}
