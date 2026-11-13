import { PagePlaceholder } from '@/app/PagePlaceholder'

export function IdCardCamera() {
  return <PagePlaceholder title="Cámara del carnet" route="/signup/id-card/camera?side=front|back" frames={['Móvil — Cámara carnet (encuadrando)', 'Móvil — Cámara carnet (listo)', 'Móvil — Cámara carnet (revisar foto)']} />
}
