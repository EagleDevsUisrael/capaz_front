import { Link } from 'react-router'
import { Button } from '@/shared/ui'
import { JobIcon } from './JobIcon'
import { jobSubtitle, jobTags, postedLabel, salaryLabel } from './labels'
import type { JobWithMatch } from './types'

interface Props {
  job: JobWithMatch
  /** Escritorio con panel lateral: elegir una oferta la muestra a la derecha en vez de abrir otra página */
  selected?: boolean
  onSelect?: (job: JobWithMatch) => void
}

/** Tarjeta de oferta: título, empresa, compatibilidad (con sesión), resumen, etiquetas, salario y botón. */
export function JobCard({ job, selected, onSelect }: Props) {
  const titleId = `job-title-${job.id}`

  return (
    <article className={`job-card${selected ? ' is-selected' : ''}`} aria-labelledby={titleId}>
      <div className="job-card__head">
        <JobIcon job={job} />
        <div>
          <h3 id={titleId} className="job-card__title">
            {job.title}
          </h3>
          <p className="job-card__sub">{jobSubtitle(job)}</p>
        </div>
        {job.match && (
          <p className="job-card__match" aria-label={`${job.match.score} % compatible contigo`}>
            <strong>{job.match.score} %</strong> compatible
          </p>
        )}
      </div>

      <p className="job-card__summary">{job.summary}</p>

      <ul className="job-card__tags" aria-label="Accesibilidad del puesto">
        {jobTags(job).map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <div className="job-card__foot">
        <div>
          <p className="job-card__salary">{salaryLabel(job)} / mes</p>
          <p className="job-card__posted">{postedLabel(job.createdAt)}</p>
        </div>

        {onSelect ? (
          <Button
            variant={selected ? 'primary' : 'secondary'}
            aria-pressed={selected}
            // El nombre accesible es el texto visible (WCAG 2.5.3); el título de la oferta va como descripción
            aria-describedby={titleId}
            onPress={() => onSelect(job)}
          >
            {selected ? 'Viendo detalle' : 'Ver detalle de la oferta'}
          </Button>
        ) : (
          <Link to={`/jobs/${job.id}`} className="ui-button ui-button--secondary" aria-describedby={titleId}>
            Ver oferta
          </Link>
        )}
      </div>
    </article>
  )
}
