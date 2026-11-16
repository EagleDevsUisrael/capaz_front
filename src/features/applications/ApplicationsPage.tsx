import { useState } from 'react'
import { Link } from 'react-router'
import { labelIn, useCatalog } from '@/shared/api/catalog'
import { errorMessage } from '@/shared/api/client'
import { Button } from '@/shared/ui'
import { formatDate, useApplicationAction, useApplications, useSimilarJobs, type Application } from './api'
import './applications.css'

/** "Mis postulaciones": estado de cada postulación, entrevista, ofertas parecidas y retiro. */
export function ApplicationsPage() {
  const { data, isPending, error } = useApplications()

  return (
    <div className="apps-page">
      <h1>Mis postulaciones</h1>
      {isPending && <p role="status">Cargando tus postulaciones…</p>}
      {error && <p role="alert">{errorMessage(error)}</p>}
      {data && data.length === 0 && (
        <div className="apps-card">
          <p>Todavía no has postulado a ninguna oferta.</p>
          <Link to="/" className="ui-button ui-button--primary">Buscar empleo</Link>
        </div>
      )}
      {data && data.length > 0 && (
        <ul className="apps-list">
          {data.map((a) => (
            <li key={a.id}>
              <ApplicationCard app={a} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ApplicationCard({ app }: { app: Application }) {
  const { data: catalog } = useCatalog()
  const confirm = useApplicationAction('confirm-interview')
  const withdraw = useApplicationAction('withdraw')
  const [asking, setAsking] = useState(false)
  const titleId = `app-${app.id}`
  const closed = app.status === 'withdrawn' || app.status === 'notSelected' || app.status === 'hired'

  // Etapas de la línea de tiempo (catálogo): 1 Enviada · 2 En revisión · 3 final
  const finalLabel =
    app.status === 'hired' || app.status === 'notSelected' || app.status === 'withdrawn'
      ? app.statusLabel
      : labelIn(catalog?.applicationStatuses, 'interview') || 'Entrevista'
  const stages = [
    labelIn(catalog?.applicationStatuses, 'sent') || 'Enviada',
    labelIn(catalog?.applicationStatuses, 'inReview') || 'En revisión',
    finalLabel,
  ]

  return (
    <article className="apps-card" aria-labelledby={titleId}>
      <h2 id={titleId} className="apps-card__title">
        <Link to={`/jobs/${app.job.id}`}>{app.job.title}</Link>
      </h2>
      <p className="apps-card__meta">
        {app.job.company} · {app.job.city} · Postulaste el {formatDate(app.createdAt)}
      </p>
      <p className={`apps-status apps-status--${app.status}`}>Estado: {app.statusLabel}</p>

      {app.status !== 'withdrawn' && (
        <ol className="apps-timeline" aria-label="Avance de la postulación">
          {stages.map((label, i) => {
            const n = i + 1
            const state = n < app.stage ? 'done' : n === app.stage ? 'current' : 'todo'
            return (
              <li key={n} className={`is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
                <span className="apps-timeline__dot" aria-hidden="true">{state === 'done' ? '✓' : n}</span>
                {label}
                <span className="visually-hidden">
                  {state === 'done' ? ' (completado)' : state === 'current' ? ' (etapa actual)' : ' (pendiente)'}
                </span>
              </li>
            )
          })}
        </ol>
      )}

      {app.status === 'interview' && app.interview && (
        <section className="apps-interview" aria-label="Entrevista">
          <h3>Tienes una entrevista</h3>
          <dl>
            <dt>Fecha</dt>
            <dd>{formatDate(app.interview.at, true)}</dd>
            {app.interview.mode && (
              <>
                <dt>Modalidad</dt>
                <dd>{labelIn(catalog?.interviewModes, app.interview.mode)}</dd>
              </>
            )}
            {app.interview.place && (
              <>
                <dt>Lugar</dt>
                <dd>{app.interview.place}</dd>
              </>
            )}
          </dl>
          {app.interview.confirmedAt ? (
            <p role="status">✓ Confirmaste tu asistencia.</p>
          ) : (
            <Button variant="sun" isDisabled={confirm.isPending} onPress={() => confirm.mutate(app.id)}>
              {confirm.isPending ? 'Confirmando…' : 'Confirmar asistencia'}
            </Button>
          )}
          {confirm.error && <p role="alert">{errorMessage(confirm.error)}</p>}
        </section>
      )}

      {app.status === 'notSelected' && <SimilarJobs app={app} />}

      {!closed && (
        <div className="apps-withdraw">
          {asking ? (
            <div role="alertdialog" aria-labelledby={`${titleId}-q`} className="apps-confirm">
              <p id={`${titleId}-q`}>¿Seguro que quieres retirar tu postulación a {app.job.title}?</p>
              <div className="apps-actions">
                <Button
                  variant="primary"
                  // Patrón alertdialog (WAI-ARIA): el foco va a la acción al abrir la confirmación
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  isDisabled={withdraw.isPending}
                  onPress={() => withdraw.mutate(app.id, { onSuccess: () => setAsking(false) })}
                >
                  Sí, retirar
                </Button>
                <Button variant="secondary" onPress={() => setAsking(false)}>No, mantener</Button>
              </div>
            </div>
          ) : (
            <Button variant="ghost" onPress={() => setAsking(true)}>Retirar postulación</Button>
          )}
          {withdraw.error && <p role="alert">{errorMessage(withdraw.error)}</p>}
        </div>
      )}
    </article>
  )
}

function SimilarJobs({ app }: { app: Application }) {
  const { data, isPending } = useSimilarJobs(app.id, (app.similarCount ?? 1) > 0)
  if (app.similarCount === 0) return <p>No te eligieron esta vez. Sigue buscando: pronto habrá nuevas ofertas.</p>
  return (
    <section className="apps-similar" aria-label="Ofertas parecidas">
      <h3>No te eligieron esta vez. Te recomendamos {app.similarCount ?? data?.length ?? ''} ofertas parecidas</h3>
      {isPending && <p role="status">Buscando ofertas parecidas…</p>}
      {data && (
        <ul>
          {data.map(({ job, match }) => (
            <li key={job.id}>
              <Link to={`/jobs/${job.id}`}>{job.title}</Link> · {job.company} · {match.score}% compatible
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
