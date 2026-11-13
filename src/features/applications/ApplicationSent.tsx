import { PagePlaceholder } from '@/app/PagePlaceholder'

export function ApplicationSent() {
  return <PagePlaceholder title="Postulación enviada" route="/applications/:applicationId/sent" frames={['Postulación enviada', 'Móvil — Postulación enviada']} />
}
