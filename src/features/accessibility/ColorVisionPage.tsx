import { useNavigate } from 'react-router'
import { Button } from '@/shared/ui'
import { ColorVisionPicker } from './ColorVisionPicker'
import './accessibility.css'

/** Colores para daltonismo en pantalla completa (celular). En escritorio el mismo selector va en un diálogo. */
export function ColorVisionPage() {
  const navigate = useNavigate()
  return (
    <div className="a11y-page">
      <h1>Colores para daltonismo</h1>
      <p className="a11y-page__lead">Elige la opción en la que distingas mejor los botones.</p>
      <ColorVisionPicker />
      <Button fullWidth onPress={() => navigate(-1)}>
        Usar estos colores
      </Button>
    </div>
  )
}
