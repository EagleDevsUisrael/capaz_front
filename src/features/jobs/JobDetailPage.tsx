import { Link, useParams } from 'react-router'
import { useA11yPrefs } from '@/features/accessibility/useA11yPrefs'
import { Button } from '@/shared/ui'
import { ArrowLeftIcon } from '@/shared/ui/icons'
import { useJob } from './api'
import { EasyReadDetail } from './EasyReadDetail'
import { JobDetail } from './JobDetail'
import './jobs.css'

/** /jobs/:jobId. Con "Lectura fácil" activa muestra la versión simple si la oferta la tiene. */
export function JobDetailPage() {
  const { jobId } = useParams()
  const easyRead = useA11yPrefs((s) => s.easyRead)
  const { data, isPending, isError, refetch } = useJob(jobId)
  const job = data?.job

  if (isPending) return <p className="state job-page">Cargando la oferta…</p>

  if (isError || !job) {
    return (
      <div className="state state--error job-page" role="alert">
        <h1>No encontramos esta oferta</h1>
        <p>Puede que ya no esté disponible.</p>
        <div className="state__actions">
          <Link to="/" className="ui-button ui-button--primary">
            Ver todas las ofertas
          </Link>
          <Button variant="secondary" onPress={() => refetch()}>
            Intentar de nuevo
          </Button>
        </div>
      </div>
    )
  }

  if (easyRead && job.easyRead) {
    return (
      <div className="job-page">
        <EasyReadDetail job={job} easyRead={job.easyRead} applicationId={data.applicationId} />
      </div>
    )
  }

  return (
    <div className="job-page">
      <Link to="/" className="job-page__back">
        <ArrowLeftIcon size={20} /> Atrás
      </Link>
      {easyRead && (
        <p className="job-page__notice" role="status">
          Esta oferta todavía no tiene la versión de Lectura fácil. Te mostramos el texto normal.
        </p>
      )}
      <JobDetail job={job} match={data.match} applicationId={data.applicationId} as="page" />
    </div>
  )
}
