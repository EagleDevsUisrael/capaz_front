import { Link, useParams } from 'react-router'
import { labelIn, useCatalog } from '@/shared/api/catalog'
import { errorMessage } from '@/shared/api/client'
import { formatDate, useApplication } from './api'
import './applications.css'

/** "Postulación enviada": confirmación y próximos pasos (GET /api/applications/:id). */
export function ApplicationSent() {
  const { applicationId } = useParams()
  const { data: app, isPending, error } = useApplication(applicationId)
  const { data: catalog } = useCatalog()

  if (isPending) return <p className="apps-page" role="status">Cargando tu postulación…</p>
  if (error || !app)
    return (
      <div className="apps-page">
        <h1>No pudimos mostrar tu postulación</h1>
        <p role="alert">{errorMessage(error)}</p>
        <Link to="/applications" className="ui-button ui-button--primary">Ir a Mis postulaciones</Link>
      </div>
    )

  const ns = app.nextSteps
  return (
    <div className="apps-page apps-sent">
      <p className="apps-sent__check" aria-hidden="true">✓</p>
      <h1>Postulación enviada</h1>
      <p className="apps-sent__lead">
        Postulaste a <strong>{app.job.title}</strong> en <strong>{app.job.company}</strong>.
      </p>

      <section className="apps-card" aria-labelledby="next-title">
        <h2 id="next-title">¿Qué sigue?</h2>
        <ol className="apps-steps">
          <li>
            La empresa revisará tu postulación en {ns?.reviewBusinessDays ?? 5} días hábiles
            {ns && <> (hasta el {formatDate(ns.reviewBy)})</>}.
          </li>
          <li>
            Si te eligen, te contactarán por{' '}
            {ns ? (
              <>
                {/* "WhatsApp" es nombre propio; "Llamada"/"Correo" van en minúscula dentro de la frase */}
                {ns.contactChannel === 'whatsapp'
                  ? 'WhatsApp'
                  : labelIn(catalog?.contactPreferences, ns.contactChannel).toLowerCase()}{' '}
                al <strong>{ns.contactValue}</strong>
              </>
            ) : (
              'tu medio de contacto preferido'
            )}
            .
          </li>
          <li>Puedes ver el estado cuando quieras en “Mis postulaciones”.</li>
        </ol>
      </section>

      <div className="apps-actions">
        <Link to="/applications" className="ui-button ui-button--primary">Ver mis postulaciones</Link>
        <Link to="/" className="ui-button ui-button--secondary">Seguir buscando empleo</Link>
      </div>
    </div>
  )
}
