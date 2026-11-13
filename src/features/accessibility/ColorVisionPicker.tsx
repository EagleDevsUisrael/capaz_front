import { Radio, RadioGroup } from 'react-aria-components'
import { CheckIcon, StopIcon } from '@/shared/ui/icons'
import { useA11yPrefs, type Vision } from './useA11yPrefs'
import './accessibility.css'

const OPTIONS: { value: Vision; title: string; desc: string }[] = [
  { value: 'normal', title: 'Colores normales', desc: 'Así se ve Capaz por defecto.' },
  { value: 'redGreen', title: 'Me cuesta distinguir rojo y verde', desc: 'El más común. Protanopia o deuteranopia.' },
  { value: 'blueYellow', title: 'Me cuesta distinguir azul y amarillo', desc: 'Poco común. Tritanopia.' },
  { value: 'mono', title: 'Veo en grises o sin colores', desc: 'Usamos solo claro y oscuro, más subrayados e iconos.' },
]

/**
 * Elegir cómo se ven los colores. Cada opción muestra un ejemplo real de botones y etiquetas pintado con
 * los colores de ese modo (data-vision en la propia tarjeta), así la persona no necesita saber el nombre
 * médico de su condición. La elección se aplica al instante a toda la app y se puede deshacer.
 */
export function ColorVisionPicker() {
  const vision = useA11yPrefs((s) => s.vision)
  const setVision = useA11yPrefs((s) => s.setVision)

  return (
    <div className="cv">
      {vision === 'highContrast' && (
        <p className="cv__note">Ahora tienes activado el alto contraste. Si eliges una opción de aquí, se apaga.</p>
      )}
      <RadioGroup
        aria-label="Colores para daltonismo"
        value={vision === 'highContrast' ? null : vision}
        onChange={(v) => setVision(v as Vision)}
        className="cv__list"
      >
        {OPTIONS.map((o) => (
          <Radio key={o.value} value={o.value} className="cv-option">
            {({ isSelected }) => (
              <>
                <span className="cv-option__head">
                  <span className="cv-option__title">{o.title}</span>
                  {isSelected && (
                    <span className="cv-option__badge">
                      <CheckIcon size={16} /> Activo
                    </span>
                  )}
                </span>
                <span className="cv-option__desc">{o.desc}</span>
                <span className="cv-preview" data-vision={o.value} aria-hidden="true">
                  <span className="cv-preview__btn cv-preview__btn--primary">Continuar</span>
                  <span className="cv-preview__btn cv-preview__btn--sun">Postular</span>
                  <span className="cv-preview__rec">
                    <StopIcon size={14} /> Grabando
                  </span>
                  <span className="cv-preview__chip">Teletrabajo</span>
                  <span className="cv-preview__match">96 % compatible</span>
                </span>
              </>
            )}
          </Radio>
        ))}
      </RadioGroup>
    </div>
  )
}
