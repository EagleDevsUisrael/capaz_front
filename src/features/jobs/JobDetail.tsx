import { ApplyButton } from './ApplyButton'
import { JobIcon } from './JobIcon'
import { DISABILITY_LABEL, MODALITY_LABEL, money } from './labels'
import type { Job } from './types'

interface Props {
  job: Job
  /** 'panel': panel lateral del inicio (título h2) · 'page': pantalla /jobs/:jobId (título h1) */
  as?: 'panel' | 'page'
}

/**
 * Detalle de una oferta. "Accesible para" va primero: es lo que la persona necesita saber antes de seguir.
 * Textos y orden del mockup: Qué harás · Ajustes que ofrece la empresa · Qué necesitas · Salario y beneficios.
 */
export function JobDetail({ job, as = 'page' }: Props) {
  const Title = as === 'page' ? 'h1' : 'h2'
  const Section = as === 'page' ? 'h2' : 'h3'

  return (
    <article className={`job-detail job-detail--${as}`}>
      <header className="job-detail__head">
        <JobIcon name={job.icon} size={32} />
        <Title className="job-detail__title">{job.title}</Title>
        <p className="job-detail__sub">
          {job.company} · {job.city}
          {job.city !== 'Todo el país' && job.modality === 'remote' ? ' · Teletrabajo desde casa' : job.modality !== 'remote' ? ` · ${MODALITY_LABEL[job.modality]}` : ''}
        </p>
        <ul className="job-detail__meta" aria-label="Datos principales">
          <li>{money(job.salary)}</li>
          <li>{MODALITY_LABEL[job.modality]}</li>
          <li>{job.hoursPerDay} h</li>
        </ul>
      </header>

      <section className="job-detail__block">
        <Section className="job-detail__h">Este puesto es accesible para:</Section>
        <ul className="job-detail__chips">
          {job.compatibleDisabilities.map((d) => (
            <li key={d}>{DISABILITY_LABEL[d]}</li>
          ))}
        </ul>
      </section>

      <section className="job-detail__block">
        <Section className="job-detail__h">Qué harás</Section>
        <p>{job.tasks}</p>
      </section>

      <section className="job-detail__block">
        <Section className="job-detail__h">Ajustes que ofrece la empresa</Section>
        <ul className="job-detail__list">
          {job.offered.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      </section>

      <section className="job-detail__block">
        <Section className="job-detail__h">Qué necesitas</Section>
        <ul className="job-detail__list">
          {job.requirements.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <section className="job-detail__block">
        <Section className="job-detail__h">Salario y beneficios</Section>
        <p>{job.benefits}</p>
      </section>

      <footer className="job-detail__apply">
        <ApplyButton job={job} fullWidth />
        <p className="job-detail__note">
          Registro de 5 minutos. Puedes hacerlo por voz.
        </p>
      </footer>
    </article>
  )
}
