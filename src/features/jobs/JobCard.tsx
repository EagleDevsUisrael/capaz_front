import { Link } from 'react-router'
import { Button } from '@/shared/ui'
import { JobIcon } from './JobIcon'
import { iconFor, jobSubtitle, jobTags, postedLabel, salaryText } from './labels'
import type { Job } from './types'

interface Props {
  job: Job
  /** Escritorio con panel lateral: elegir una oferta la muestra a la derecha en vez de abrir otra página */
  selected?: boolean
  onSelect?: (job: Job) => void
}

/** Tarjeta de oferta: título, empresa, resumen, etiquetas de accesibilidad, salario y botón de detalle. */
export function JobCard({ job, selected, onSelect }: Props) {
  const titleId = `job-title-${job.id}`

  return (
    <article className={`job-card${selected ? ' is-selected' : ''}`} aria-labelledby={titleId}>
      <div className="job-card__head">
        <JobIcon name={iconFor(job)} />
        <div>
          <h3 id={titleId} className="job-card__title">
            {job.title}
          </h3>
          <p className="job-card__sub">{jobSubtitle(job)}</p>
        </div>
      </div>

      <p className="job-card__summary">{job.summary}</p>

      <ul className="job-card__tags" aria-label="Accesibilidad del puesto">
        {jobTags(job).map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <div className="job-card__foot">
        <div>
          <p className="job-card__salary">{salaryText(job)} / mes</p>
          <p className="job-card__posted">{postedLabel(job.createdAt)}</p>
        </div>

        {onSelect ? (
          <Button
            variant={selected ? 'primary' : 'secondary'}
            aria-pressed={selected}
            aria-label={`${selected ? 'Viendo detalle de' : 'Ver detalle de'} ${job.title}`}
            onPress={() => onSelect(job)}
          >
            {selected ? 'Viendo detalle' : 'Ver detalle de la oferta'}
          </Button>
        ) : (
          <Link to={`/jobs/${job.id}`} className="ui-button ui-button--secondary" aria-label={`Ver detalle de ${job.title}`}>
            Ver oferta
          </Link>
        )}
      </div>
    </article>
  )
}
