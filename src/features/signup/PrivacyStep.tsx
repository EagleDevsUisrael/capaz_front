import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useSession } from '@/features/auth/useSession'
import { Button, Switch } from '@/shared/ui'
import { ShieldCheckIcon } from '@/shared/ui/icons'
import { ACCOMMODATIONS, EDUCATION_LEVELS, labelOf } from './options'
import { StepFrame } from './StepFrame'
import { useSignupStore } from './useSignupStore'

/**
 * Paso 4: consentimiento explícito (Ley Orgánica de Protección de Datos Personales).
 * Se registra cuándo se dio (consentAt). La empresa nunca ve el carnet, el diagnóstico ni el porcentaje.
 */
export function PrivacyStep() {
  const navigate = useNavigate()
  const contact = useSignupStore((s) => s.contact)
  const experience = useSignupStore((s) => s.experience)
  const saved = useSignupStore((s) => s.privacy)
  const savePrivacy = useSignupStore((s) => s.savePrivacy)
  const markCompleted = useSignupStore((s) => s.markCompleted)

  const [shareOnly, setShareOnly] = useState(saved.shareOnlyAccommodations)
  const [discoverable, setDiscoverable] = useState(saved.discoverable)

  const finish = () => {
    // TODO(backend): enviar el registro completo (datos + consentimiento) y recibir la sesión
    savePrivacy({ shareOnlyAccommodations: shareOnly, discoverable })
    markCompleted(4)
    useSession.getState().signIn() // demostración: sin backend no hay sesión real
    navigate('/for-you')
  }

  const summary = [contact.city, labelOf(EDUCATION_LEVELS, experience.education)].filter(Boolean).join(' · ')
  const needs = experience.accommodationsNeeded.map((a) => labelOf(ACCOMMODATIONS, a))

  return (
    <StepFrame
      step={4}
      title="Tú decides qué se comparte"
      lead="Tus datos de salud son datos sensibles según la Ley Orgánica de Protección de Datos Personales. Nunca los vendemos ni los mostramos sin tu permiso."
    >
      <div className="step">
        <div className="privacy-card">
          <Switch
            label="Usar mi perfil para recomendarme empleos"
            description="Necesario para que la plataforma funcione. (obligatorio)"
            isSelected
            isReadOnly
          />
          <Switch
            label="Mostrar a la empresa solo los ajustes que necesito"
            description="La empresa no ve tu carnet, tu diagnóstico ni tu porcentaje."
            isSelected={shareOnly}
            onChange={setShareOnly}
          />
          <Switch
            label="Que las empresas me encuentren sin postular"
            description="Te pueden invitar a ofertas nuevas."
            isSelected={discoverable}
            onChange={setDiscoverable}
          />
        </div>

        <section className="privacy-preview" aria-labelledby="preview-title">
          <h2 id="preview-title" className="privacy-preview__title">Así te verá la empresa</h2>
          <p className="privacy-preview__name">{contact.fullName || 'Tu nombre'}</p>
          {summary && <p className="privacy-preview__summary">{summary}</p>}
          {shareOnly ? (
            needs.length > 0 && (
              <div>
                <p className="privacy-preview__label">Ajustes que necesita:</p>
                <ul className="privacy-preview__tags">
                  {needs.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
            )
          ) : (
            <p className="privacy-preview__summary">No verá tus ajustes.</p>
          )}
          <p className="privacy-preview__hidden">
            <ShieldCheckIcon size={20} /> Carnet y diagnóstico ocultos
          </p>
        </section>

        <p className="step__note">
          Puedes cambiar estos permisos o borrar tu cuenta y todos tus datos cuando quieras, desde “Mi perfil”.
        </p>

        <div className="step__footer">
          <Button variant="secondary" onPress={() => navigate('/signup/experience')}>
            Volver al paso 3
          </Button>
          <Button className="step__next" onPress={finish}>
            Ver mis trabajos
          </Button>
        </div>
      </div>
    </StepFrame>
  )
}
