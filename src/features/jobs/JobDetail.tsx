import { Link } from 'react-router'
import { ApplyButton } from './ApplyButton'
import { JobIcon } from './JobIcon'
import { DISABILITY_LABEL, MODALITY_LABEL, SCHEDULE_LABEL, salaryLabel } from './labels'
import type { Job, Match } from './types'

interface Props {
  job: Job
  /** Solo con sesión: "Por qué encaja contigo" */
  match?: Match | null
  /** Si ya postuló (solo con sesión) */
  applicationId?: string | null
  /** 'panel': panel lateral del inicio (título h2) · 'page': pantalla /jobs/:jobId (título h1) */
  as?: 'panel' | 'page'
}

/**
 * Detalle de una oferta. "Accesible para" va primero: es lo que la persona necesita saber antes de seguir.
 * Textos y orden del mockup: Qué harás · Ajustes que ofrece la empresa · Qué necesitas · Salario y beneficios.
 */
export function JobDetail({ job, match, applicationId, as = 'page' }: Props) {
  const Title = as === 'page' ? 'h1' : 'h2'
  const Section = as === 'page' ? 'h2' : 'h3'
  const place = job.modality === 'remote' ? 'Teletrabajo desde casa' : `${job.city} · ${MODALITY_LABEL[job.modality]}`

  return (
    <article className={`job-detail job-detail--${as}`}>
      <header className="job-detail__head">
        <JobIcon job={job} size={32} />
        <Title className="job-detail__title">{job.title}</Title>
        <p className="job-detail__sub">
          {job.company} · {place}
        </p>
        <ul className="job-detail__meta" aria-label="Datos principales">
          <li>{salaryLabel(job)}</li>
          <li>{SCHEDULE_LABEL[job.schedule]}</li>
          {job.dailyHours != null && <li>{job.dailyHours} h al día</li>}
        </ul>
      </header>

      {match && !match.rejected && (
        <section className="job-detail__block job-detail__match">
          <Section className="job-detail__h">Por qué encaja contigo · {match.score} %</Section>
          {match.reasons.length > 0 && (
            <ul className="job-detail__list">
              {match.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
          {match.warnings.length > 0 && (
            <>
              <p className="job-detail__warn-h">Conviene preguntar:</p>
              <ul className="job-detail__list job-detail__list--warn">
                {match.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {job.compatibleDisabilities.length > 0 && (
        <section className="job-detail__block">
          <Section className="job-detail__h">Este puesto es accesible para:</Section>
          <ul className="job-detail__chips">
            {job.compatibleDisabilities.map((d) => (
              <li key={d}>{DISABILITY_LABEL[d]}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="job-detail__block">
        <Section className="job-detail__h">Qué harás</Section>
        <p>{job.description}</p>
      </section>

      {job.accommodationsDetail.length > 0 && (
        <section className="job-detail__block">
          <Section className="job-detail__h">Ajustes que ofrece la empresa</Section>
          <ul className="job-detail__list">
            {job.accommodationsDetail.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </section>
      )}

      {job.requirements.length > 0 && (
        <section className="job-detail__block">
          <Section className="job-detail__h">Qué necesitas</Section>
          <ul className="job-detail__list">
            {job.requirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="job-detail__block">
        <Section className="job-detail__h">Salario y beneficios</Section>
        <p>{job.salaryBenefits || salaryLabel(job)}</p>
      </section>

      <footer className="job-detail__apply">
        {applicationId ? (
          <>
            <p className="job-detail__applied" role="status">
              ✓ Ya postulaste a esta oferta.
            </p>
            <Link to="/applications" className="ui-button ui-button--secondary">
              Ver mis postulaciones
            </Link>
          </>
        ) : (
          <>
            <ApplyButton job={job} fullWidth />
            <p className="job-detail__note">Registro de 5 minutos. Puedes hacerlo por voz.</p>
          </>
        )}
      </footer>
    </article>
  )
}
