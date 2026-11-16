import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { RequireSession } from '@/features/auth/RequireSession'
import { useMe } from '@/features/auth/api'
import { useSession } from '@/features/auth/useSession'
import { api, errorMessage } from '@/shared/api/client'
import { labelIn, useCatalog } from '@/shared/api/catalog'
import type { ApplicationStatus, Job, Match, Profile } from '@/shared/api/types'
import './matches.css'

interface MatchItem {
  job: Job
  match: Match
  applicationId: string | null
}

/** GET /api/matches (capaz_backend/src/modules/matches.ts) */
export interface MatchesResponse {
  threshold: number
  profileComplete: boolean
  missingAccommodations: boolean
  consideredFactors: string[]
  counts: { matching: number; recommended: number; totalJobs: number }
  firstApplication: { applicationId: string; status: ApplicationStatus; job: Job; match: Match } | null
  recommended: MatchItem[]
  others: MatchItem[]
  rejected: MatchItem[]
}

export const useMatches = () => useQuery({ queryKey: ['matches'], queryFn: () => api<MatchesResponse>('/matches') })

/** GET /api/matches/ai: explicación de la IA (capaz_ia → Ollama) sobre las ofertas ya elegidas por las reglas */
interface AiAdviceResponse {
  summary: string | null
  items: { jobId: string; why: string }[]
  tip: string | null
  provider: string | null
}

/**
 * "Lo que te recomienda la IA". Carga aparte (la IA puede tardar) y, si falla, no muestra nada:
 * las recomendaciones de abajo siguen funcionando sin IA.
 */
function aiCacheKey(profile: Profile | null, recommended: MatchItem[]) {
  if (!profile) return ''
  const value = JSON.stringify({
    candidate: profile.id,
    city: profile.contact.city,
    hasWorked: profile.experience.hasWorked,
    experienceText: profile.experience.experienceText,
    education: profile.experience.education,
    skills: profile.experience.skills,
    accommodationsNeeded: profile.experience.accommodationsNeeded,
    otherAccommodation: profile.experience.otherAccommodation,
    jobs: recommended.map((r) => r.job.id),
  })
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619)
  return (hash >>> 0).toString(16)
}

function AiAdvice({ cacheKey }: { cacheKey: string }) {
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  const q = useQuery({
    queryKey: ['matches', 'ai', cacheKey],
    queryFn: () => api<AiAdviceResponse>('/matches/ai'),
    enabled: Boolean(cacheKey),
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })

  const refresh = async () => {
    setRefreshing(true)
    try {
      const fresh = await api<AiAdviceResponse>('/matches/ai', { query: { refresh: true } })
      queryClient.setQueryData(['matches', 'ai', cacheKey], fresh)
    } finally {
      setRefreshing(false)
    }
  }

  if (q.isError || (q.data && !q.data.summary)) return null
  return (
    <section aria-labelledby="foryou-ai" className="foryou__ai" aria-busy={q.isPending}>
      <div className="foryou__ai-head">
        <h2 id="foryou-ai">
          <span aria-hidden="true">✨ </span>Recomendaciones de IA
        </h2>
        <button type="button" className="foryou__ai-refresh" onClick={() => void refresh()} disabled={q.isFetching || refreshing}>
          {q.isFetching || refreshing ? 'Analizando…' : 'Volver a consultar IA'}
        </button>
      </div>
      {q.isPending ? (
        <p className="foryou__small" role="status">
          Analizando tus ajustes y experiencia laboral…
        </p>
      ) : (
        <>
          <p className="foryou__ai-summary">La IA te recomendó estas ofertas de acuerdo con tus ajustes y experiencia laboral.</p>
          {q.data.tip && (
            <p className="foryou__ai-tip">
              <strong>Consejo:</strong> {q.data.tip}
            </p>
          )}
          <p className="foryou__small">Sugerencias hechas con IA. Revisa cada oferta antes de postular.</p>
        </>
      )}
    </section>
  )
}

export function ForYouPage() {
  return (
    <RequireSession>
      <ForYou />
    </RequireSession>
  )
}

function ForYou() {
  useMe()
  const profile = useSession((s) => s.profile)
  const { data: cat } = useCatalog()
  const q = useMatches()

  const chips = profile
    ? [
        labelIn(cat?.disabilityTypes, profile.idCard.disabilityType),
        profile.contact.city,
        ...profile.experience.skills.map((s) => labelIn(cat?.skills, s)),
        ...profile.experience.accommodationsNeeded.map((a) => labelIn(cat?.accommodations, a)),
      ].filter(Boolean)
    : []

  return (
    <div className="foryou">
      <header className="foryou__head">
        <h1>Trabajos para ti</h1>
        {chips.length > 0 && (
          <section aria-labelledby="foryou-profile">
            <h2 id="foryou-profile" className="foryou__small">
              Tu perfil
            </h2>
            <ul className="foryou__chips">
              {chips.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </section>
        )}
      </header>

      <div aria-live="polite" aria-busy={q.isPending}>
        {q.isPending && <p className="foryou__state">Buscando los trabajos que encajan contigo…</p>}
        {q.isError && (
          <div className="foryou__state" role="alert">
            <p>⚠ {errorMessage(q.error)}</p>
            <button className="foryou__btn" onClick={() => void q.refetch()}>
              Intentar otra vez
            </button>
          </div>
        )}
        {q.data && <Results data={q.data} profile={profile} />}
      </div>

      <p className="foryou__note">
        <strong>Es una sugerencia, no un límite.</strong> Puedes postular a cualquier oferta.{' '}
        <Link to="/">Ver todas las ofertas</Link>
      </p>
    </div>
  )
}

function Results({ data, profile }: { data: MatchesResponse; profile: Profile | null }) {
  const { counts, recommended, firstApplication } = data
  return (
    <>
      <p className="foryou__lead">
        {counts.matching > 0
          ? `Encontramos ${counts.matching} ${counts.matching === 1 ? 'trabajo que encaja' : 'trabajos que encajan'} contigo.`
          : 'Por ahora no encontramos trabajos que encajen mucho contigo.'}
      </p>
      {data.consideredFactors.length > 0 && (
        <p className="foryou__small">Tomamos en cuenta: {data.consideredFactors.join(', ')}.</p>
      )}
      {data.missingAccommodations && (
        <p className="foryou__warn">
          No marcaste ajustes que necesitas. Si los agregas, las sugerencias serán más precisas.
        </p>
      )}

      {firstApplication && (
        <section aria-labelledby="foryou-first">
          <h2 id="foryou-first">La oferta a la que postulaste</h2>
          <MatchCard item={{ ...firstApplication }} />
        </section>
      )}

      {recommended.length > 0 && <AiAdvice cacheKey={aiCacheKey(profile, recommended)} />}

      <section aria-labelledby="foryou-rec">
        <h2 id="foryou-rec">Recomendados para ti</h2>
        {recommended.length === 0 ? (
          <p className="foryou__state">
            No hay recomendaciones nuevas. Revisa todas las ofertas: hay {counts.totalJobs} publicadas.
          </p>
        ) : (
          <RecommendedCarousel items={recommended} />
        )}
      </section>
      {data.others.length > 0 && (
        <p className="foryou__small">
          Hay {data.others.length} ofertas más que también podrían interesarte.{' '}
          <Link to="/">Ver todas las ofertas</Link>
        </p>
      )}
    </>
  )
}

function RecommendedCarousel({ items }: { items: MatchItem[] }) {
  const [index, setIndex] = useState(0)
  useEffect(() => setIndex((current) => Math.min(current, Math.max(0, items.length - 1))), [items.length])
  const move = (delta: number) => setIndex((current) => (current + delta + items.length) % items.length)
  const current = items[index]
  if (!current) return null
  return (
    <div className="foryou__carousel" aria-roledescription="carrusel" aria-label="Trabajos recomendados">
      <div className="foryou__carousel-card" aria-live="polite">
        <MatchCard item={current} />
      </div>
      <div className="foryou__carousel-controls">
        <button type="button" className="foryou__btn foryou__btn--secondary" onClick={() => move(-1)} aria-label="Trabajo recomendado anterior">
          Anterior
        </button>
        <span className="foryou__pagination" aria-live="polite">{index + 1} de {items.length}</span>
        <button type="button" className="foryou__btn" onClick={() => move(1)} aria-label="Siguiente trabajo recomendado">
          Siguiente
        </button>
      </div>
    </div>
  )
}

function MatchCard({ item }: { item: { job: Job; match: Match; applicationId?: string | null } }) {
  const { job, match } = item
  const titleId = `job-${job.id}`
  return (
    <article className="foryou__card" aria-labelledby={titleId}>
      <div className="foryou__cardhead">
        <div>
          <h3 id={titleId}>
            <Link to={`/jobs/${job.id}`}>{job.title}</Link>
          </h3>
          <p className="foryou__small">
            {job.company} · {job.city}
          </p>
        </div>
        <p className="foryou__score" aria-label={`${match.score} por ciento de compatibilidad`}>
          <span>{match.score}%</span> compatible
        </p>
      </div>
      {item.applicationId && <p className="foryou__badge">Ya postulaste</p>}
      {match.reasons.length > 0 && (
        <>
          <h4>Por qué encaja contigo</h4>
          <ul className="foryou__reasons">
            {match.reasons.map((r) => (
              <li key={r}>
                <span aria-hidden="true">✓ </span>
                {r}
              </li>
            ))}
          </ul>
        </>
      )}
      {match.warnings.length > 0 && (
        <>
          <h4>Conviene preguntar</h4>
          <ul className="foryou__warnings">
            {match.warnings.map((w) => (
              <li key={w}>
                <span aria-hidden="true">! </span>
                {w}
              </li>
            ))}
          </ul>
        </>
      )}
      <Link className="foryou__btn" to={`/jobs/${job.id}`} aria-describedby={titleId}>
        Ver oferta
      </Link>
    </article>
  )
}
