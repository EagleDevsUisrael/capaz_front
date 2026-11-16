import { useState } from 'react'
import { Link } from 'react-router'
import { useSession } from '@/features/auth/useSession'
import { Button } from '@/shared/ui'
import { CloseIcon, SlidersIcon } from '@/shared/ui/icons'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { useJobs, useStats } from './api'
import { FiltersPanel } from './FiltersPanel'
import { FiltersSheet } from './FiltersSheet'
import { JobCard } from './JobCard'
import { JobDetail } from './JobDetail'
import { FEATURE_LABEL, SALARY_OPTIONS, SCHEDULE_LABEL } from './labels'
import { SearchBar } from './SearchBar'
import { useJobFilters } from './useJobFilters'
import './jobs.css'

/** Cuota legal de contratación (LOSEP/Código del Trabajo): cifra fija del mockup, el backend no la entrega */
const LEGAL_QUOTA = 4

const plural = (n: number, one: string, many: string) => `${n.toLocaleString('es-EC')} ${n === 1 ? one : many}`

/**
 * Inicio. Sin sesión se ven TODAS las ofertas; filtrar a mano es libre. Lo que pide sesión es la
 * compatibilidad personalizada ("más compatibles") y postular. En escritorio ancho el detalle va en un
 * panel a la derecha; en pantallas más chicas, cada oferta abre /jobs/:jobId.
 */
export function JobsPage() {
  const signedIn = useSession((s) => s.signedIn)
  const { filters, setFilters, clear, activeCount, hasAny } = useJobFilters()
  const { data, isPending, isError, refetch, isFetching } = useJobs(filters)
  const stats = useStats().data
  const showPanel = useMediaQuery('(min-width: 1180px)')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const jobs = data?.items ?? []
  const selected = jobs.find((j) => j.id === selectedId) ?? jobs[0]

  // Texto de resultados: "Mostrando 3 ofertas con teletrabajo y acceso en silla de ruedas".
  // El backend exige que la oferta cumpla TODOS los filtros marcados, por eso "y" (el mockup decía "o"; ver informe).
  const withText = filters.features.length
    ? ` con ${filters.features.map((a) => FEATURE_LABEL[a].toLowerCase()).join(' y ')}`
    : ''
  const countText = data ? `Mostrando ${plural(data.total, 'oferta', 'ofertas')}${withText}` : 'Buscando ofertas…'

  const activeChips = [
    ...filters.features.map((a) => ({
      key: `a-${a}`,
      label: FEATURE_LABEL[a],
      remove: () => setFilters({ features: filters.features.filter((x) => x !== a) }),
    })),
    ...filters.schedule.map((w) => ({
      key: `w-${w}`,
      label: SCHEDULE_LABEL[w],
      remove: () => setFilters({ schedule: filters.schedule.filter((x) => x !== w) }),
    })),
    ...(filters.salary
      ? [{ key: 's', label: SALARY_OPTIONS.find((o) => o.value === filters.salary)!.label, remove: () => setFilters({ salary: null }) }]
      : []),
  ]

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__inner">
          <p className="hero__ods">ODS 10 · Reducción de las desigualdades</p>
          <div className="hero__grid">
            <div>
              <h1 id="hero-title" className="hero__title">
                Encuentra un trabajo que se adapta a ti
              </h1>
              <p className="hero__lead">
                Ofertas de empleo en Ecuador para personas con discapacidad. Registras tu carnet una sola vez y te
                mostramos los puestos donde mejor encajas, con los ajustes que cada empresa ya ofrece.
              </p>
            </div>
            {stats && (
              <ul className="hero__stats" aria-label="Capaz en cifras">
                <li>
                  <strong>{stats.activeJobs.toLocaleString('es-EC')}</strong>
                  <span>ofertas inclusivas activas</span>
                </li>
                <li>
                  <strong>{stats.provinces}</strong>
                  <span>provincias</span>
                </li>
                <li>
                  <strong>{LEGAL_QUOTA} %</strong>
                  <span>cuota legal de contratación</span>
                </li>
              </ul>
            )}
          </div>
          <SearchBar
            key={`${filters.q}|${filters.where}`}
            q={filters.q}
            where={filters.where}
            onSearch={(v) => setFilters(v)}
          />
          <p className="hero__hint">Toca el micrófono y di lo que buscas. También funciona con TalkBack y VoiceOver.</p>
        </div>
      </section>

      {/* ---------- Cuerpo ---------- */}
      <div className="jobs-body">
        <aside className="jobs-body__filters" aria-label="Filtros">
          <FiltersPanel filters={filters} facets={data?.facets} onChange={setFilters} onClear={clear} showHeader />
        </aside>

        <section className="jobs-body__list" aria-labelledby="list-title">
          <div className="jobs-body__list-head">
            <div>
              <h2 id="list-title" className="jobs-body__title">
                {hasAny ? 'Resultados' : 'Todas las ofertas'}
              </h2>
              <p className="jobs-body__count" role="status" aria-live="polite">
                {countText}
              </p>
            </div>
            <p className="jobs-body__sort">Ordenadas: más recientes primero</p>
          </div>

          {/* Celular: botón de filtros + chips de lo activo */}
          <div className="jobs-body__mobile-filters">
            <Button variant="secondary" onPress={() => setSheetOpen(true)}>
              <SlidersIcon size={20} /> Filtros{activeCount > 0 ? ` (${activeCount})` : ''}
            </Button>
            {activeChips.length > 0 && (
              <ul className="active-chips" aria-label="Filtros activos">
                {activeChips.map((c) => (
                  <li key={c.key}>
                    <button type="button" className="active-chip" onClick={c.remove} aria-label={`Quitar filtro ${c.label}`}>
                      {c.label} <CloseIcon size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Invitación a ingresar: la compatibilidad personalizada pide sesión */}
          <aside className="invite" aria-label="Recomendaciones para ti">
            {signedIn ? (
              <>
                <p>
                  <strong>Ya tienes tu perfil.</strong> Mira los trabajos donde mejor encajas.
                </p>
                <Link to="/for-you" className="ui-button ui-button--primary">
                  Ver trabajos para mí
                </Link>
              </>
            ) : (
              <>
                <p>
                  <strong>¿Quieres ver dónde mejor encajas?</strong> Registra tu carnet una sola vez y ordenamos las
                  ofertas por compatibilidad. Para postular también necesitas tu perfil.
                </p>
                <div className="invite__actions">
                  <Link to="/signup/id-card" className="ui-button ui-button--primary">
                    Crear mi perfil
                  </Link>
                  <Link to="/login" className="ui-button ui-button--secondary">
                    Ya tengo cuenta
                  </Link>
                </div>
              </>
            )}
          </aside>

          {isError && (
            <div className="state state--error" role="alert">
              <p>⚠ No pudimos cargar las ofertas.</p>
              <Button onPress={() => refetch()}>Intentar de nuevo</Button>
            </div>
          )}

          {isPending && !isError && <p className="state">Buscando ofertas…</p>}

          {data && jobs.length === 0 && (
            <div className="state">
              <p>No encontramos ofertas con esos filtros.</p>
              <Button variant="secondary" onPress={clear}>
                Borrar filtros
              </Button>
            </div>
          )}

          <ul className={`job-list${isFetching ? ' is-fetching' : ''}`}>
            {jobs.map((job) => (
              <li key={job.id}>
                <JobCard
                  job={job}
                  selected={showPanel && selected?.id === job.id}
                  onSelect={showPanel ? (j) => setSelectedId(j.id) : undefined}
                />
              </li>
            ))}
          </ul>
        </section>

        {showPanel && selected && (
          <aside className="jobs-body__detail" aria-label="Detalle de la oferta">
            <JobDetail job={selected} as="panel" />
          </aside>
        )}
      </div>

      <FiltersSheet
        isOpen={sheetOpen}
        onOpenChange={setSheetOpen}
        filters={filters}
        facets={data?.facets}
        total={data?.total}
        onChange={setFilters}
        onClear={clear}
      />
    </>
  )
}
